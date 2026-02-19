from typing import Optional

from pydantic import BaseModel

from app.schemas.anomaly_readout import AnomalyReadout
from app.schemas.api_run import ApiRunRead
from app.schemas.performance import PerformanceReadout
from app.schemas.risk_readout import RiskReadout
from app.schemas.schema_drift import SchemaDriftReadout


class MonitorRunResult(BaseModel):
    """
    Full result of a triggered monitoring run.

    Combines the persisted ApiRun with real-time performance analysis,
    schema drift detection, AI anomaly analysis, and composite risk score.
    This is the response from POST /api/v1/monitor/run/{endpoint_id}.
    """

    run: ApiRunRead
    performance: Optional[PerformanceReadout] = None
    schema_drift: Optional[SchemaDriftReadout] = None
    anomaly: Optional[AnomalyReadout] = None
    risk: Optional[RiskReadout] = None
