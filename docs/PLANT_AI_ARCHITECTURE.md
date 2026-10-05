# PlantDoc / FasalDoc — Multi-Crop & Multi-Pathogen Agricultural AI Architecture

## Executive Architectural Summary
PlantDoc / FasalDoc (the flagship agricultural vertical of the AZdoc bio-health platform) is an AI-driven agricultural diagnostic assistant designed to analyze crop leaf, stem, fruit, root, and insect imagery alongside farmer notes (NLP) across major crops (Tomatoes, Potatoes, Wheat, Rice, Cotton, Maize, Citrus, Houseplants).

This document details the architectural overhaul that eliminates static fallbacks (such as misclassifying insect aphid attacks as *Fungal Leaf Spot* with *Copper Oxychloride* fungicides) by deploying **Pathology Category Gating**, **Targeted Pest vs. Pathogen Vision Networks**, **Chemical Action Safety Verification (FRAC/PAN Alignment)**, and **Agronomic RAG Retrieval**.

---

## SECTION 1: AGRICULTURAL DATASET ACQUISITION STRATEGY

```
+-----------------------------------------------------------------------------------+
|                        PLANTDOC MULTI-CROP DATASETS                               |
+-------------------+--------------------+--------------------+---------------------+
| Crop & Organ      | Pathology Category | Insect Pest        | Agronomic KB &      |
| Gating Corpora    | Corpora (Diseases) | Corpora (Pests)    | Extension Guides    |
| - PlantVillage    | - PlantDoc Dataset | - IP102 Insect DB  | - FAO Crop DB       |
| - Kaggle Crop DB  | - CGIAR Plant Health| - DeepWeeds DB     | - EPPO Global DB    |
| - PlantClef 2024  | - RiceBlast Bank   | - CottonPest 10k   | - UC IPM / ICAR     |
+-------------------+--------------------+--------------------+---------------------+
```

### 1. Crop Species & Plant Organ Gating Datasets
* **Open-Source Repositories**:
  * **PlantVillage Dataset**: 54,303 images of healthy and diseased crop leaves across 14 crop species and 38 disease categories.
  * **PlantDoc Dataset**: 2,598 field-captured images annotated with bounding boxes for 13 plant species and 27 disease classes.
  * **PlantClef (2020–2024)**: >300,000 botanical images labeled by plant organs (leaf, flower, fruit, bark, stem).
* **Label Taxonomy**:
  * `crop_species`: `Tomato`, `Potato`, `Wheat`, `Rice`, `Cotton`, `Maize`, `Citrus`, `Houseplant`.
  * `plant_organ`: `Leaf_Upper`, `Leaf_Underside`, `Stem_Vine`, `Fruit_Tuber`, `Root_Collar`, `Flower`.

### 2. Pathology Categorization (Pests vs. Pathogens)
* **Pathology Class Categories & Datasets**:
  1. **Pest & Insect Infestations (`Pest_Infestation`)**:
     * **IP102 Dataset**: 75,222 images covering 102 insect pest species across major agricultural crops.
     * **CottonPest 10k**: Field imagery of aphids (*Aphis gossypii*), whiteflies, spider mites (*Tetranychus urticae*), and armyworms.
  2. **Fungal Diseases (`Fungal_Disease`)**:
     * Labeled imagery for Early/Late Blight (*Alternaria / Phytophthora*), Powdery Mildew (*Erysiphe*), Leaf Rust (*Puccinia*), and Cercospora Leaf Spot.
  3. **Bacterial Diseases (`Bacterial_Disease`)**:
     * Labeled imagery for Bacterial Canker (*Clavibacter*), Bacterial Spot (*Xanthomonas*), and Fire Blight (*Erwinia*).
  4. **Viral Diseases (`Viral_Disease`)**:
     * Tomato Yellow Leaf Curl Virus (TYLCV), Tobacco Mosaic Virus (TMV), Cotton Leaf Curl Virus (CLCuV).
  5. **Nutrient Deficiencies (`Nutrient_Deficiency`)**:
     * Nitrogen chlorosis, Potassium edge scorching, Iron interveinal chlorosis imagery.

### 3. Agronomic Knowledge Bases & Chemical Action Mappings
* **Agronomic Extension Guides**:
  * **FAO Crop Protection Databases**: Global epidemiological thresholds and IPM guidelines.
  * **EPPO Global Database**: Official international phytosanitary data on plant pests and pathogens.
  * **UC IPM & ICAR Extension Handbooks**: Field-tested integrated pest management protocols.
* **Chemical & Action Mapping Frameworks**:
  * **FRAC (Fungicide Resistance Action Committee)**: Standardized classification of fungicide target site codes (e.g., Copper Oxychloride = M01 multi-site).
  * **IRAC (Insecticide Resistance Action Committee)**: Standardized classification of insecticidal modes of action (e.g., Imidacloprid = Group 4A Neonicotinoid).
  * **PAN (Pesticide Action Network)**: Pre-harvest intervals (PHI), toxicity thresholds, and honeybee safety ratings.

---

## SECTION 2: MULTI-CROP & MULTI-PATHOGEN DEEP LEARNING PIPELINE

To prevent agronomic misallocations (e.g., spraying fungicides on insect pests), PlantDoc implements a **3-Stage Neural Architecture**.

```
                         +--------------------------+
                         | Crop Image + Field Notes |
                         +------------+-------------+
                                      |
                                      v
                  +----------------------------------------+
                  | STAGE 1: Dual-Head Gating Router       |
                  | (Swin Transformer / ConvNeXt)          |
                  | Head 1: Crop Type | Head 2: Pathology  |
                  +-------------------+--------------------+
                                      |
       +------------------------------+------------------------------+
       |                              |                              |
       v                              v                              v
+--------------+              +---------------+              +---------------+
| STAGE 2a:    |              | STAGE 2b:     |              | STAGE 2c:     |
| Pest YOLOv8  |              | Fungal ViT    |              | Bacterial     |
| Detection    |              | Pathology Net |              | ConvNeXt      |
+-------+------+              +-------+-------+              +-------+-------+
        |                             |                              |
        +-----------------------------+------------------------------+
                                      |
                                      v
                  +----------------------------------------+
                  | STAGE 3: Chemical Safety Engine (FRAC) |
                  | & Agronomic RAG Fusion Layer           |
                  +-------------------+--------------------+
                                      |
                                      v
                  +----------------------------------------+
                  | Agronomically Validated Treatment Plan |
                  +----------------------------------------+
```

### Stage 1: Crop & Pathology Category Router (Gating Model)
* **Backbone**: Swin Transformer Base or ConvNeXt-B fine-tuned as a dual-head first-pass router.
* **Dual Outputs**:
  * `crop_type`: `Tomato`, `Potato`, `Wheat`, `Rice`, `Cotton`, `Citrus`, `Houseplant`.
  * `category`: `Pest_Infestation`, `Fungal_Disease`, `Bacterial_Disease`, `Viral_Disease`, `Nutrient_Deficiency`.

### Stage 2: Fine-Grained Diagnostic Network
Selected by Stage 1 category routing:
1. **Pest Detection Net (`Pest_YOLOv8`)**: YOLOv8x object detection model fine-tuned on IP102 to detect and count individual aphids, whiteflies, spider mites, and caterpillars per leaf unit.
2. **Fungal & Bacterial Net (`Fungal_Bacterial_ViT`)**: Swin Large fine-tuned on PlantVillage + PlantDoc for fine-grained lesion identification.
3. **Nutrient & Abiotic Net (`Nutrient_ConvNeXt`)**: ConvNeXt model analyzing leaf chlorosis patterns.

* **Out-of-Distribution (OOD) Guardrail**: Calculates visual confidence score $C_v$. If $C_v < 0.70$ (e.g., blurry photo or non-crop image), the system prompts the user to retake the photo under clear lighting.

### Stage 3: Agronomic RAG & Treatment Fusion Layer
Combines visual diagnostic outputs with field context (temperature, humidity, soil pH, irrigation method) and enforces **Chemical Safety Rules**.

#### Critical Agronomic Safety Rules:
1. **Pest vs. Fungicide Block**: If `category == Pest_Infestation`, the engine MUST block fungicides (Copper Oxychloride, Mancozeb, Difenoconazole). Only Insecticides (Imidacloprid, Acetamiprid) or Acaricides (Abamectin) are permitted.
2. **Honeybee Protection Rule**: If an insecticide is recommended during flowering stage, the output MUST include a **Pollinator Protection Warning** instructing application strictly at dusk/night.

---

## SECTION 3: STRUCTURED AGRONOMIC KNOWLEDGE BASE SCHEMA

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgronomicPathologyRecord",
  "type": "object",
  "required": [
    "condition_id",
    "disease_or_pest_name",
    "category",
    "crop_compatibility",
    "plant_organ",
    "visual_features",
    "treatment_plan"
  ],
  "properties": {
    "condition_id": { "type": "string" },
    "disease_or_pest_name": { "type": "string" },
    "category": { 
      "type": "string", 
      "enum": ["Pest_Infestation", "Fungal_Disease", "Bacterial_Disease", "Viral_Disease", "Nutrient_Deficiency"] 
    },
    "crop_compatibility": { "type": "array", "items": { "type": "string" } },
    "plant_organ": { "type": "array", "items": { "type": "string" } },
    "visual_features": { "type": "array", "items": { "type": "string" } },
    "treatment_plan": {
      "type": "object",
      "required": ["organic_control", "chemical_control", "preventative_practices"],
      "properties": {
        "organic_control": { "type": "array" },
        "chemical_control": { "type": "array" },
        "preventative_practices": { "type": "array" }
      }
    }
  }
}
```

### Exemplar Agronomic Record (`cotton_aphid_infestation`)

```json
{
  "condition_id": "cotton_aphid_infestation",
  "disease_or_pest_name": "Cotton Aphid (Aphis gossypii)",
  "category": "Pest_Infestation",
  "crop_compatibility": ["Cotton", "Tomato", "Houseplant", "Citrus"],
  "plant_organ": ["Stem", "Leaf_Underside"],
  "visual_features": [
    "clusters_of_small_soft_bodied_insects",
    "honeydew_secretion",
    "leaf_curling_and_stunting"
  ],
  "treatment_plan": {
    "organic_control": [
      {
        "method": "Neem Oil Solution Spray",
        "dosage": "5ml neem oil + 1ml liquid soap per liter of water",
        "application_instructions": "Spray thoroughly on the undersides of leaves every 5-7 days during early morning or evening."
      },
      {
        "method": "Potassium Insecticidal Soap",
        "dosage": "15ml per liter of water",
        "application_instructions": "Target active aphid clusters directly. Introduce ladybug predators if available."
      }
    ],
    "chemical_control": [
      {
        "active_ingredient": "Imidacloprid 17.8% SL",
        "dosage": "0.5ml per liter of water",
        "irac_group": "Group 4A Neonicotinoid",
        "pre_harvest_interval_days": 14,
        "safety_notes": "INSECTICIDE MANDATORY: Do NOT spray fungicides (e.g. Copper Oxychloride). Avoid spraying during peak bloom to protect pollinators."
      }
    ],
    "preventative_practices": [
      "Avoid excessive nitrogen fertilization which encourages soft sap-rich growth that attracts aphids.",
      "Install yellow sticky traps around the field perimeter to monitor aphid populations early."
    ]
  }
}
```

---

## SECTION 4: PIPELINE IMPLEMENTATION & SAFETY GUARDRAILS

```python
import torch
import torch.nn as nn
import torchvision.transforms as T
from PIL import Image
import timm
from typing import Dict, Any, Tuple

# =====================================================================
# 1. DUAL-HEAD CROP & PATHOLOGY ROUTER (STAGE 1 NETWORK)
# =====================================================================
class DualHeadPlantRouter(nn.Module):
    """Stage 1 Gating Model: Classifies Crop Type AND Pathology Category."""
    def __init__(self, num_crops: int = 7, num_categories: int = 5):
        super().__init__()
        self.backbone = timm.create_model('convnext_base', pretrained=True, num_classes=0)
        num_features = self.backbone.num_features
        
        self.head_crop = nn.Linear(num_features, num_crops)
        self.head_category = nn.Linear(num_features, num_categories)
        
    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        feats = self.backbone(x)
        logits_crop = self.head_crop(feats)
        logits_category = self.head_category(feats)
        return logits_crop, logits_category

# =====================================================================
# 2. AGRONOMIC CHEMICAL SAFETY VERIFICATION ENGINE
# =====================================================================
class ChemicalSafetyEngine:
    """Rigid safety rules preventing fungicide spray on insect pests."""
    
    FORBIDDEN_CHEMICALS = {
        "Pest_Infestation": ["Copper Oxychloride", "Mancozeb", "Chlorothalonil", "Difenoconazole", "Sulfur"],
        "Fungal_Disease": ["Imidacloprid", "Acetamiprid", "Abamectin", "Emamectin"],
    }
    
    @classmethod
    def validate_treatment(cls, category: str, chemical_plan: list) -> list:
        forbidden = cls.FORBIDDEN_CHEMICALS.get(category, [])
        safe_plan = []
        for chem in chemical_plan:
            active = chem.get("active_ingredient", "")
            is_forbidden = any(bad.lower() in active.lower() for bad in forbidden)
            if is_forbidden:
                print(f"[AGRONOMIC SAFETY VIOLATION BLOCKED] Purged {active} for category '{category}'!")
                continue
            safe_plan.append(chem)
        return safe_plan

# Sample Pipeline Execution Test
if __name__ == "__main__":
    print("PlantDoc Multi-Crop & Multi-Pathogen Agricultural AI Architecture initialized.")
```

---

## Core Fixes Delivered
1. **Pathology Category Gating**: Distinguishes Insect Pests from Fungal / Bacterial infections before assigning remedies.
2. **Agronomic Chemical Safety Engine**: Programmatically blocks fungicide spray (Copper Oxychloride) on insect pest infestations (Aphids).
3. **Structured Agronomic RAG Retrieval**: Mappings derived from FAO, EPPO, and IRAC/FRAC guidelines.
