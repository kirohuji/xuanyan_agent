#!/usr/bin/env bash
# 下载 GGUF 模型到 models/ 目录（支持国内镜像 & Alibaba Cloud ModelScope）
#
# 用法：
#   ./download-model.sh                              # 下载默认 Qwen2.5-7B
#   LLAMA_MODEL=Qwen3-4B-Q4_K_M.gguf ./download-model.sh
#   HF_ENDPOINT=https://hf-mirror.com ./download-model.sh   # 使用 HF 镜像
#   SOURCE=modelscope ./download-model.sh                   # 使用阿里云 ModelScope
#
# 可选模型（设 LLAMA_MODEL）：
#   Qwen2.5-7B-Instruct-Q4_K_M.gguf    Qwen2.5-7B  (推荐，~4.7 GB)
#   Qwen3-4B-Q4_K_M.gguf               Qwen3-4B     (~2.7 GB)

set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODEL_DIR="${DIR}/models"
MODEL_NAME="${LLAMA_MODEL:-Qwen2.5-7B-Instruct-Q4_K_M.gguf}"
MODEL="${MODEL_DIR}/${MODEL_NAME}"
DOWNLOAD_SOURCE="${SOURCE:-huggingface}"  # huggingface | modelscope

# ===== 下载源配置 =====
HF_BASE="${HF_ENDPOINT:-https://hf-mirror.com}"           # HuggingFace 国内镜像
MODELSCOPE_BASE="https://modelscope.cn/models"             # 阿里云 ModelScope

# 模型 URL 映射（HuggingFace）
declare -A MODEL_URLS_HF=(
  ["Qwen2.5-7B-Instruct-Q4_K_M.gguf"]="${HF_BASE}/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf"
  ["Qwen3-4B-Q4_K_M.gguf"]="${HF_BASE}/unsloth/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf"
)

# 模型 URL 映射（阿里云 ModelScope）
declare -A MODEL_URLS_MSCOPE=(
  ["Qwen2.5-7B-Instruct-Q4_K_M.gguf"]="${MODELSCOPE_BASE}/qwen/Qwen2.5-7B-Instruct-GGUF/resolve/master/Qwen2.5-7B-Instruct-Q4_K_M.gguf"
  ["Qwen3-4B-Q4_K_M.gguf"]="${MODELSCOPE_BASE}/Qwen/Qwen3-4B-GGUF/resolve/master/Qwen3-4B-Q4_K_M.gguf"
)

# 选择下载源
if [[ "${DOWNLOAD_SOURCE}" == "modelscope" ]]; then
  declare -n MODEL_URLS=MODEL_URLS_MSCOPE
  SOURCE_NAME="阿里云 ModelScope"
else
  declare -n MODEL_URLS=MODEL_URLS_HF
  SOURCE_NAME="HuggingFace 镜像 ($HF_BASE)"
fi

URL="${MODEL_URLS[${MODEL_NAME}]:-}"
if [[ -z "${URL}" ]]; then
  echo "错误：未知模型 '${MODEL_NAME}'"
  echo "可用模型：${!MODEL_URLS[*]}"
  echo ""
  echo "提示：如果模型不在当前源 (${SOURCE_NAME})，请尝试另一种源："
  echo "  SOURCE=modelscope ./download-model.sh    # 阿里云"
  echo "  SOURCE=huggingface ./download-model.sh   # HF 镜像"
  exit 1
fi

mkdir -p "${MODEL_DIR}"

if [[ -f "${MODEL}" ]] && [[ -s "${MODEL}" ]]; then
  echo "已存在且非空，跳过下载: ${MODEL}"
  ls -lh "${MODEL}"
  exit 0
fi

echo "下载源：${SOURCE_NAME}"
echo "模型：${MODEL_NAME}"
echo "下载到: ${MODEL}"
echo "URL: ${URL}"
echo ""

# -L 跟随重定向；-C - 支持断点续传；--progress-bar 显示进度条
curl -L --retry 5 --retry-delay 2 -C - --progress-bar -o "${MODEL}.part" "${URL}"
mv -f "${MODEL}.part" "${MODEL}"

echo ""
echo "完成: ${MODEL}"
ls -lh "${MODEL}"
