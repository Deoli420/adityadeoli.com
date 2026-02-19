from typing import Optional

from pydantic import BaseModel


class PerformanceReadout(BaseModel):
    """Performance analysis snapshot for a single run or on-demand query."""

    current_time_ms: float
    rolling_avg_ms: Optional[float] = None
    rolling_median_ms: Optional[float] = None
    rolling_stddev_ms: Optional[float] = None
    deviation_percent: Optional[float] = None
    is_spike: bool = False
    is_critical_spike: bool = False
    sample_size: int = 0
    has_enough_data: bool = False
