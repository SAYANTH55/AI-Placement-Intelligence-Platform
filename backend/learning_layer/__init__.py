"""
learning_layer/__init__.py
──────────────────────────
Public surface of the Learning Layer package.
Import from here to avoid coupling to internal module paths.
"""

from .learning_service  import learning_service
from .inference_engine  import inference_engine
from .feedback_collector import feedback_collector
from .feature_engineer  import engineer_features, explain_features, FEATURE_NAMES, FEATURE_DIM
from .model_trainer     import ModelTrainer
from .dataset_builder   import DatasetBuilder

__all__ = [
    "learning_service",
    "inference_engine",
    "feedback_collector",
    "engineer_features",
    "explain_features",
    "FEATURE_NAMES",
    "FEATURE_DIM",
    "ModelTrainer",
    "DatasetBuilder",
]
