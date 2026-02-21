from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from decimal import Decimal
import logging
import aiohttp
import time

from app.config import settings
from app.indicators import IndicatorCalculator
from app.models import IndicatorData, EMAData, VWAPData
from app.scoring import SetupScorer

logger = logging.getLogger(__name__)


class IndicatorService:
    """
    Service for fetching market data and calculating indicators
    """
    
    def __init__(self):
        self.db_client = None
        self.db = None
        self.calculator = IndicatorCalculator()
        
    async def connect_db(self):
        """Connect to MongoDB"""
        try:
            self.db_client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.db = self.db_client[settings.MONGODB_DATABASE]
            logger.info("Connected to MongoDB")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    async def close_db(self):
        """Close MongoDB connection"""
        if self.db_client:
            self.db_client.close()
            logger.info("Closed MongoDB connection")
    
    async def get_market_snapshots(
        self, 
        symbol: str, 
        hours: int = 24
    ) -> List[Dict]:
        """
        Fetch market snapshots from MongoDB
        
        Args:
            symbol: Symbol to fetch (NIFTY or BANKNIFTY)
            hours: Number of hours to look back
            
        Returns:
            List of market snapshots
        """
        try:
            start_time = datetime.utcnow() - timedelta(hours=hours)
            
            cursor = self.db.market_snapshots.find({
                'symbol': symbol,
                'timestamp': {'$gte': start_time}
            }).sort('timestamp', 1)
            
            snapshots = await cursor.to_list(length=None)
            
            logger.info(f"Fetched {len(snapshots)} snapshots for {symbol}")
            return snapshots
            
        except Exception as e:
            logger.error(f"Error fetching market snapshots: {e}")
            return []
    
    async def calculate_indicators_for_symbol(
        self, 
        symbol: str, 
        timeframe: str = "5m"
    ) -> Optional[IndicatorData]:
        """
        Calculate all indicators for a symbol
        
        Args:
            symbol: Symbol to calculate for
            timeframe: Timeframe (5m or 15m)
            
        Returns:
            IndicatorData or None if calculation fails
        """
        try:
            # Fetch historical data (need enough for resampling)
            hours = 2 if timeframe == "5m" else 4
            snapshots = await self.get_market_snapshots(symbol, hours)
            
            if len(snapshots) < 50:
                logger.warning(f"Insufficient data for {symbol}: {len(snapshots)} snapshots")
                return None
            
            # Prepare data for resampling
            data = []
            for snap in snapshots:
                if 'ohlc1m' in snap and snap['ohlc1m']:
                    ohlc = snap['ohlc1m']
                    data.append({
                        'timestamp': snap['timestamp'],
                        'open': float(ohlc.get('open', 0)),
                        'high': float(ohlc.get('high', 0)),
                        'low': float(ohlc.get('low', 0)),
                        'close': float(ohlc.get('close', 0)),
                        'volume': int(ohlc.get('volume', 0))
                    })
            
            if len(data) < 50:
                logger.warning(f"Insufficient OHLC data for {symbol}")
                return None
            
            # Resample to target timeframe
            resampled = self.calculator.resample_to_timeframe(data, timeframe)
            
            if resampled.empty or len(resampled) < 50:
                logger.warning(f"Insufficient resampled data for {symbol}")
                return None
            
            # Calculate EMAs
            close_prices = resampled['close'].tolist()
            emas = self.calculator.calculate_all_emas(close_prices)
            
            # Detect EMA slope for each period
            ema9_slope = self.calculator.detect_ema_slope(close_prices[-20:], 5) if emas['ema9'] else "neutral"
            
            # Detect EMA alignment
            alignment = self.calculator.detect_ema_alignment(
                emas['ema9'], 
                emas['ema20'], 
                emas['ema50']
            )
            
            # Calculate VWAP
            typical_prices = []
            volumes = []
            
            for _, row in resampled.iterrows():
                typical_price = self.calculator.calculate_typical_price(
                    row['high'], 
                    row['low'], 
                    row['close']
                )
                typical_prices.append(typical_price)
                volumes.append(int(row['volume']))
            
            vwap_value = self.calculator.calculate_vwap(typical_prices, volumes)
            
            # Get current price
            current_price = float(resampled['close'].iloc[-1])
            
            # Calculate VWAP position
            vwap_position, vwap_distance = self.calculator.calculate_vwap_position(
                current_price, 
                vwap_value
            )
            
            # Build indicator data
            ema_data = EMAData(
                ema9=Decimal(str(round(emas['ema9'], 2))) if emas['ema9'] else Decimal('0'),
                ema20=Decimal(str(round(emas['ema20'], 2))) if emas['ema20'] else Decimal('0'),
                ema50=Decimal(str(round(emas['ema50'], 2))) if emas['ema50'] else Decimal('0'),
                slope=ema9_slope,
                alignment=alignment
            )
            
            vwap_data = VWAPData(
                value=Decimal(str(round(vwap_value, 2))) if vwap_value else Decimal('0'),
                position=vwap_position,
                distance=Decimal(str(round(vwap_distance, 2)))
            )
            
            indicator_data = IndicatorData(
                symbol=symbol,
                timeframe=timeframe,
                timestamp=datetime.utcnow(),
                ema=ema_data,
                vwap=vwap_data
            )
            
            # Store in MongoDB
            await self.store_indicator_data(indicator_data)
            
            logger.info(f"Calculated indicators for {symbol} ({timeframe})")
            return indicator_data
            
        except Exception as e:
            logger.error(f"Error calculating indicators for {symbol}: {e}", exc_info=True)
            return None
    
    async def store_indicator_data(self, indicator_data: IndicatorData):
        """Store indicator data in MongoDB"""
        try:
            document = {
                'symbol': indicator_data.symbol,
                'timeframe': indicator_data.timeframe,
                'timestamp': indicator_data.timestamp,
                'ema': {
                    'ema9': float(indicator_data.ema.ema9),
                    'ema20': float(indicator_data.ema.ema20),
                    'ema50': float(indicator_data.ema.ema50),
                    'slope': indicator_data.ema.slope,
                    'alignment': indicator_data.ema.alignment
                },
                'vwap': {
                    'value': float(indicator_data.vwap.value),
                    'position': indicator_data.vwap.position,
                    'distance': float(indicator_data.vwap.distance)
                },
                'calculated_at': datetime.utcnow()
            }
            
            await self.db.indicator_data.insert_one(document)
            logger.info(f"Stored indicator data for {indicator_data.symbol} ({indicator_data.timeframe})")
            
        except Exception as e:
            logger.error(f"Error storing indicator data: {e}")
    
    async def get_latest_indicators(
        self, 
        symbol: str, 
        timeframe: str = "5m"
    ) -> Optional[Dict]:
        """
        Get latest stored indicators from MongoDB
        """
        try:
            result = await self.db.indicator_data.find_one(
                {'symbol': symbol, 'timeframe': timeframe},
                sort=[('timestamp', -1)]
            )
            
            if result:
                result['_id'] = str(result['_id'])
                return result
            return None
            
        except Exception as e:
            logger.error(f"Error fetching latest indicators: {e}")
            return None
    
    # ============================================================================
    # Phase 2: Scoring Methods
    # ============================================================================
    
    async def fetch_oi_analysis(self, symbol: str) -> Optional[Dict]:
        """
        Fetch OI analysis from option-chain-service (Phase 3)
        Returns None if service unavailable or Phase 3 not implemented yet
        """
        try:
            url = f"http://option-chain-service:8082/api/option-chain/{symbol}/analysis"
            timeout = aiohttp.ClientTimeout(total=5)
            
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.warning(f"option-chain-service returned {response.status} for {symbol}")
                        return None
                        
        except aiohttp.ClientError as e:
            logger.warning(f"Failed to fetch OI analysis for {symbol}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error fetching OI analysis for {symbol}: {e}")
            return None
    
    async def calculate_score_for_symbol(
        self, 
        symbol: str, 
        timeframe: str = "5m"
    ) -> Optional[Dict]:
        """
        Calculate setup score for a symbol using all scoring components
        """
        start_time = time.time()
        
        try:
            # Initialize scorer
            scorer = SetupScorer()
            
            # Fetch recent market snapshots (last 4 hours)
            market_data = await self.get_market_snapshots(
                symbol=symbol,
                hours=4 
            )
            
            if not market_data:
                logger.error(f"No market data available for {symbol}")
                return None
            
            # Fetch latest indicators
            indicators = await self.get_latest_indicators(symbol, timeframe)
            
            if not indicators:
                logger.warning(f"No indicators available for {symbol}, calculating now...")
                # Calculate indicators on-the-fly
                indicator_result = await self.calculate_indicators_for_symbol(
                    symbol=symbol,
                    timeframe=timeframe,
                    hours=4
                )
                if not indicator_result:
                    logger.error(f"Failed to calculate indicators for {symbol}")
                    return None
            
            # Fetch OI analysis from Phase 3 service (if available)
            oi_analysis = await self.fetch_oi_analysis(symbol)
            
            # Prepare data for scorer
            score_data = {
                'symbol': symbol,
                'timeframe': timeframe,
                'market_snapshots': market_data,
                'indicators': indicators if indicators else indicator_result,
                'oi_analysis': oi_analysis
            }
            
            # Calculate score
            result = scorer.calculate_setup_score(score_data)
            
            # Add timing information
            result['evaluation_time_seconds'] = round(time.time() - start_time, 3)
            result['timestamp'] = datetime.utcnow()
            
            # Store in database
            await self.store_score_data(result)
            
            logger.info(
                f"Calculated score for {symbol} ({timeframe}): "
                f"{result['setup_score']:.2f} - {result['market_bias']}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating score for {symbol}: {e}")
            return None
    
    async def store_score_data(self, score_data: Dict) -> None:
        """
        Store calculated score in MongoDB
        """
        try:
            if not self.db:
                await self.connect_db()
            
            document = {
                'symbol': score_data['symbol'],
                'timeframe': score_data['timeframe'],
                'timestamp': score_data['timestamp'],
                'setup_score': score_data['setup_score'],
                'market_bias': score_data['market_bias'],
                'components': score_data['components'],
                'evaluation_time_seconds': score_data['evaluation_time_seconds'],
                'created_at': datetime.utcnow()
            }
            
            await self.db.scoring_snapshots.insert_one(document)
            logger.info(
                f"Stored score for {score_data['symbol']} ({score_data['timeframe']}): "
                f"{score_data['setup_score']:.2f}"
            )
            
        except Exception as e:
            logger.error(f"Error storing score data: {e}")
    
    async def get_score_history(
        self, 
        symbol: str, 
        timeframe: str = "5m",
        limit: int = 20
    ) -> List[Dict]:
        """
        Get historical scores for a symbol
        """
        try:
            if not self.db:
                await self.connect_db()
            
            cursor = self.db.scoring_snapshots.find(
                {'symbol': symbol, 'timeframe': timeframe}
            ).sort('timestamp', -1).limit(limit)
            
            scores = []
            async for doc in cursor:
                doc['_id'] = str(doc['_id'])
                scores.append(doc)
            
            return scores
            
        except Exception as e:
            logger.error(f"Error fetching score history: {e}")
            return []


# Global service instance
indicator_service = IndicatorService()
