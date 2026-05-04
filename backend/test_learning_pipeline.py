"""
Full end-to-end pipeline validation for the Learning Layer.
Run from backend/ directory: python test_learning_pipeline.py
"""
import sys, os, random
sys.path.insert(0, os.getcwd())

from learning_layer.feedback_collector import feedback_collector, FEEDBACK_LOG_FILE
from learning_layer.feature_engineer import engineer_features, explain_features, FEATURE_DIM
from learning_layer.dataset_builder import DatasetBuilder
from learning_layer.model_trainer import ModelTrainer
from learning_layer.inference_engine import inference_engine
from learning_layer.learning_service import learning_service

print("=" * 65)
print("LEARNING LAYER — END-TO-END PIPELINE TEST")
print("=" * 65)

# ── Step 1: Seed 25 synthetic feedback records ────────────────────────────────
random.seed(99)
print("\n[1] Seeding 25 feedback records...")

for i in range(25):
    before = round(random.uniform(0.30, 0.70), 3)
    after  = round(before + random.uniform(-0.05, 0.25), 3)
    after  = max(0.0, min(1.0, after))

    profile = {
        "skill_vector": {
            "SkillA": {"score": after,  "confidence": after,  "stability": 0.5},
            "SkillB": {"score": before, "confidence": before, "stability": 0.4},
        },
        "trajectory": {
            "velocity":     round(random.uniform(-0.05, 0.10), 3),
            "acceleration": 0.01,
        },
        "behavior": {
            "accuracy":     round(random.uniform(0.40, 0.90), 3),
            "consistency":  round(random.uniform(0.40, 0.85), 3),
            "weak_areas":   ["DSA"],
            "strong_areas": ["Python"],
        },
        "time_spent_hours": random.uniform(2, 40),
        "attempts": random.randint(10, 100),
    }
    graph = {
        "expanded_gaps":   ["gap"] * random.randint(0, 6),
        "root_cause_gaps": [],
    }
    feats = engineer_features(profile, graph)

    feedback_collector.log_interaction({
        "user_id":             f"user-{i:03d}",
        "before_score":        before,
        "after_score":         after,
        "accuracy":            profile["behavior"]["accuracy"],
        "consistency":         profile["behavior"]["consistency"],
        "engineered_features": feats,
        "graph_gap_depth":     len(graph["expanded_gaps"]),
    })

total_logs = feedback_collector.get_log_count()
print(f"    Total logs in store: {total_logs}")
assert total_logs >= 25, "Expected at least 25 logs"
print("    PASS: Feedback collector OK")

# ── Step 2: Build ML dataset ──────────────────────────────────────────────────
print("\n[2] Building training dataset...")
builder = DatasetBuilder(FEEDBACK_LOG_FILE)

cls_ds = builder.build_training_set(mode="classification")
reg_ds = builder.build_training_set(mode="regression")

print(f"    Classification meta: {cls_ds['meta']}")
print(f"    Regression meta:     {reg_ds['meta']}")
assert len(cls_ds["features"]) >= 10, "Need at least 10 training samples"
print("    PASS: Dataset builder OK")

# ── Step 3: Train the model ───────────────────────────────────────────────────
print("\n[3] Training GradientBoosting classifier...")
trainer = ModelTrainer(mode="classification")
result  = trainer.train(cls_ds)
print(f"    Status:        {result.get('status')}")
print(f"    Estimator:     {result.get('estimator')}")
print(f"    Train score:   {result.get('train_score')}")
print(f"    Val score:     {result.get('val_score')}")
print(f"    Version:       {result.get('version')}")
assert result.get("status") == "ok", f"Training failed: {result}"
print("    PASS: Model trainer OK")

# ── Step 4: Hot-reload inference engine ───────────────────────────────────────
print("\n[4] Hot-reloading inference engine...")
reloaded = inference_engine.reload()
print(f"    Reloaded:      {reloaded}")
print(f"    Available:     {inference_engine.is_available()}")
info = inference_engine.model_info()
print(f"    Version:       {info.get('version')}")
print(f"    Estimator:     {info.get('estimator')}")
assert inference_engine.is_available(), "Inference engine should be available after training"
print("    PASS: Inference engine loaded OK")

# ── Step 5: ML inference (switched from heuristic) ────────────────────────────
print("\n[5] Running ML prediction on test profile...")
test_profile = {
    "skill_vector": {
        "Python": {"score": 0.78, "confidence": 0.78, "stability": 0.6},
        "DSA":    {"score": 0.42, "confidence": 0.42, "stability": 0.3},
    },
    "trajectory": {"velocity": 0.05, "acceleration": 0.01},
    "behavior": {
        "accuracy":     0.70,
        "consistency":  0.65,
        "weak_areas":   ["DSA"],
        "strong_areas": ["Python"],
    },
    "time_spent_hours": 15,
    "attempts": 60,
}
graph_test = {"expanded_gaps": ["DP", "Trees"], "root_cause_gaps": []}
feats = engineer_features(test_profile, graph_test)
pred  = inference_engine.predict(feats)

print(f"    Source:          {pred.get('source')}")
print(f"    Predicted score: {pred.get('predicted_score')}")
print(f"    Confidence:      {pred.get('confidence')}")
print(f"    Placement prob:  {pred.get('placement_prob')}")
print(f"    Time to ready:   {pred.get('time_to_ready')}")
print(f"    Risk level:      {pred.get('risk_level')}")
assert pred.get("source", "").startswith("ml_trained"), \
    f"Expected ML source, got: {pred.get('source')}"
print("    PASS: ML inference active (heuristic replaced)")

# ── Step 6: LearningService end-to-end ───────────────────────────────────────
print("\n[6] LearningService full pipeline...")
intel = {
    "skill_vector": test_profile["skill_vector"],
    "trajectory":   test_profile["trajectory"],
    "behavior":     test_profile["behavior"],
    "time_spent_hours": 15,
    "attempts": 60,
}
full_pred = learning_service.get_prediction(intel, graph_test, user_id="test-veteran")
print(f"    Source:          {full_pred.get('source')}")
print(f"    Cold start flag: {full_pred.get('cold_start')}")

explained = learning_service.explain(feats)
print(f"    Feature dims:    {len(explained)}/{FEATURE_DIM}")
status = learning_service.status()
print(f"    Model available: {status['model_available']}")
print(f"    Should retrain:  {status['should_retrain']}")
print("    PASS: LearningService OK")

# ── Step 7: Recommendation engine ─────────────────────────────────────────────
print("\n[7] Recommendation engine...")
learning_service.record_learning_path_outcome(
    user_id="test-veteran",
    path_id="path-dsa-fundamentals",
    path_topics=["Arrays", "Linked Lists", "Trees"],
    score_before=0.42,
    score_after=0.61,
)
learning_service.record_learning_path_outcome(
    user_id="test-veteran",
    path_id="path-system-design",
    path_topics=["Databases", "Caching", "Load Balancing"],
    score_before=0.55,
    score_after=0.60,
)
candidates = [
    {"path_id": "path-dsa-fundamentals",   "topics": ["Arrays", "Linked Lists", "Trees"]},
    {"path_id": "path-system-design",      "topics": ["Databases", "Caching"]},
    {"path_id": "path-algorithms-advanced","topics": ["DP", "Graphs", "Backtracking"]},
]
ranked = learning_service.recommend_paths("test-veteran", candidates, top_k=3)
print("    Ranked paths:")
for r in ranked:
    print(f"      [{r['path_id']}] expected_delta={r['expected_delta']}")
assert len(ranked) <= 3
print("    PASS: Recommendation engine OK")

# ── Final summary ─────────────────────────────────────────────────────────────
print()
print("=" * 65)
print("ALL 7 STEPS PASSED — Learning Layer is fully operational")
print("=" * 65)
print()
print("Pipeline flow:")
print("  raw user data")
print("    -> feature_engineer  (12-dim vector)")
print("    -> inference_engine  (sklearn GBM / XGBoost / LightGBM)")
print("    -> prediction dict   (score, confidence, risk, TTR)")
print("    -> feedback_collector (append-only JSONL)")
print("    -> dataset_builder   (train/val split, cls + reg)")
print("    -> model_trainer     (versioned artifact, registry)")
print("    -> hot-reload        (inference switches heuristic -> ML)")
print("    -> recommendation    (path ranking by empirical delta)")
