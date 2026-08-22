from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.models.analytics import AcademicConfig
from app.schemas.analytics import AcademicConfigUpdate, AcademicConfigResponse
from app.services.scoring_engine import get_academic_config
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/config", tags=["Institution Configuration"])

@router.get("", response_model=AcademicConfigResponse)
def get_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_academic_config(db)

@router.put("", response_model=AcademicConfigResponse)
def update_config(
    config_in: AcademicConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Validate weights sum to 100
    total_weights = (
        config_in.weight_internal_assessment +
        config_in.weight_assignments +
        config_in.weight_quizzes +
        config_in.weight_attendance +
        config_in.weight_midterm +
        config_in.weight_final
    )
    if round(total_weights, 1) != 100.0:
        raise HTTPException(
            status_code=400,
            detail=f"Assessment weightages must sum to exactly 100%. Current sum: {total_weights}%"
        )

    config = get_academic_config(db)
    old_values = {
        "weights": {
            "ia": config.weight_internal_assessment,
            "assignments": config.weight_assignments,
            "quizzes": config.weight_quizzes,
            "attendance": config.weight_attendance,
            "midterm": config.weight_midterm,
            "final": config.weight_final
        }
    }

    for key, value in config_in.model_dump().items():
        setattr(config, key, value)

    db.commit()
    db.refresh(config)

    log_audit_event(
        db=db,
        action="CONFIG_UPDATED",
        entity_type="AcademicConfig",
        entity_id=str(config.id),
        user=current_user,
        details={"old": old_values, "new": config_in.model_dump()}
    )

    return config
