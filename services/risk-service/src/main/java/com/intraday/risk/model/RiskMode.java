package com.intraday.risk.model;

public enum RiskMode {
    CONSERVATIVE(1.0),
    BALANCED(2.0),
    AGGRESSIVE(3.0);

    private final double riskPercentage;

    RiskMode(double riskPercentage) {
        this.riskPercentage = riskPercentage;
    }

    public double getRiskPercentage() {
        return riskPercentage;
    }
}
