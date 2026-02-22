"""
Socket.IO service for pushing real-time setup score updates to frontend
"""
import socketio
import logging
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Create Socket.IO server instance
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)

# Wrap with ASGI application
socket_app = socketio.ASGIApp(sio)

# Track connected clients
connected_clients = set()


@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    connected_clients.add(sid)
    logger.info(f"Socket.io client connected: {sid} (Total: {len(connected_clients)})")


@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    connected_clients.discard(sid)
    logger.info(f"Socket.io client disconnected: {sid} (Total: {len(connected_clients)})")


@sio.event
async def subscribe(sid, symbol: str):
    """Handle symbol subscription"""
    logger.info(f"Client {sid} subscribed to symbol: {symbol}")
    await sio.enter_room(sid, symbol)


@sio.event
async def unsubscribe(sid, symbol: str):
    """Handle symbol unsubscription"""
    logger.info(f"Client {sid} unsubscribed from symbol: {symbol}")
    await sio.leave_room(sid, symbol)


async def broadcast_setup_score_update(
    symbol: str,
    timeframe: str,
    score: float,
    components: Dict[str, Any],
    bias: str
):
    """
    Broadcast setup score update to all subscribers of a symbol
    
    Args:
        symbol: Stock symbol (NIFTY, BANKNIFTY)
        timeframe: Timeframe (5m, 15m, etc.)
        score: Setup score (0-10)
        components: Score component breakdown
        bias: Market bias (BULLISH/BEARISH/NEUTRAL)
    """
    try:
        data = {
            "symbol": symbol,
            "timeframe": timeframe,
            "score": score,
            "components": components,
            "bias": bias,
            "timestamp": datetime.now().isoformat()
        }
        
        # Broadcast to room with symbol+timeframe as room name
        room = f"{symbol}_{timeframe}"
        await sio.emit('setup_score_update', data, room=room)
        
        # Also broadcast to symbol room for any listener
        await sio.emit('setup_score_update', data, room=symbol)
        
        logger.debug(f"Broadcasted setup score update for {symbol} {timeframe}: score={score:.2f}")
        
    except Exception as e:
        logger.error(f"Error broadcasting setup score update: {e}")


async def broadcast_no_trade_update(symbol: str, timeframe: str, data: Dict[str, Any]):
    """
    Broadcast no-trade zone update
    
    Args:
        symbol: Stock symbol
        timeframe: Timeframe
        data: No-trade score data
    """
    try:
        payload = {
            "symbol": symbol,
            "timeframe": timeframe,
            "data": data,
            "timestamp": datetime.now().isoformat()
        }
        
        room = f"{symbol}_{timeframe}"
        await sio.emit('no_trade_update', payload, room=room)
        await sio.emit('no_trade_update', payload, room=symbol)
        
        logger.debug(f"Broadcasted no-trade update for {symbol} {timeframe}")
        
    except Exception as e:
        logger.error(f"Error broadcasting no-trade update: {e}")


def get_connected_clients_count() -> int:
    """Get count of connected Socket.io clients"""
    return len(connected_clients)
