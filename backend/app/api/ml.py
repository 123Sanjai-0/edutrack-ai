from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import require_faculty_or_admin, get_current_user
from app.models.user import User
from app.schemas.ml import (
    MLTrainRequest, MLTrainResponse,
    MLPredictRequest, MLPredictResponse
)
from app.ml.model_trainer import train_academic_models
from app.ml.predictor import predict_student_performance, get_or_load_models
from app.services.audit_service import log_audit_event

router = APIRouter(prefix="/ml", tags=["Machine Learning Pipeline"])

@router.post("/train", response_model=MLTrainResponse)
def trigger_model_retraining(
    req: MLTrainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_faculty_or_admin)
):
    try:
        meta_info = train_academic_models(
            include_synthetic=req.include_synthetic,
            test_size=req.test_size,
            random_state=req.random_state
        )
        
        log_audit_event(
            db=db,
            action="ML_MODELS_RETRAINED",
            entity_type="MLPipeline",
            entity_id=meta_info["version"],
            user=current_user,
            details=meta_info
        )

        return {
            "message": "Academic Performance & Risk models retrained and serialized successfully",
            "trained_at": meta_info["trained_at"],
            "regression_metrics": meta_info["regression_metrics"],
            "classification_metrics": meta_info["classification_metrics"],
            "feature_importances": meta_info["feature_importances"],
            "model_version": meta_info["version"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training failed: {str(e)}")

@router.post("/predict", response_model=MLPredictResponse)
def run_custom_prediction(
    req: MLPredictRequest,
    current_user: User = Depends(get_current_user)
):
    features = req.model_dump()
    result = predict_student_performance(features)
    return result

@router.get("/meta")
def get_ml_metadata(current_user: User = Depends(get_current_user)):
    _, _, meta = get_or_load_models()
    return meta
