<script setup lang="ts">
import { onMounted, ref } from 'vue'
import Card from './components/card.vue'
import SparkWallet from './components/SparkWallet.vue'
import { useGame } from './core/useGame'
import { basicCannon, schoolPride } from './core/utils'
import type { CardNode } from './types/type'
import { t, currentLanguage, switchLanguage, initLanguage, getLevelOrdinal } from './i18n'

const containerRef = ref<HTMLElement | undefined>()
const clickAudioRef = ref<HTMLAudioElement | undefined>()
const dropAudioRef = ref<HTMLAudioElement | undefined>()
const winAudioRef = ref<HTMLAudioElement | undefined>()
const loseAudioRef = ref<HTMLAudioElement | undefined>()
const curLevel = ref(1)
const showTip = ref(false)
const LevelConfig = [
  { cardNum: 4, layerNum: 2, trap: false },
  { cardNum: 9, layerNum: 3, trap: false },
  { cardNum: 15, layerNum: 6, trap: false },
]

const isWin = ref(false)
const showSparkWallet = ref(false)
const showRewardAfterWin = ref(false)
const isWalletConnected = ref(false)

const {
  nodes,
  selectedNodes,
  handleSelect: originalHandleSelect,
  handleBack,
  backFlag,
  handleRemove,
  removeFlag,
  removeList,
  handleSelectRemove,
  initData,
} = useGame({
  container: containerRef,
  cardNum: 4,
  layerNum: 2,
  trap: false,
  events: {
    clickCallback: handleClickCard,
    dropCallback: handleDropCard,
    winCallback: handleWin,
    loseCallback: handleLose,
  },
})

// 包装handleSelect函数，添加钱包检查
function handleSelect(node: CardNode) {
  if (!isWalletConnected.value) {
    // 静默处理，不弹出alert，因为已有覆盖层提示
    return
  }
  originalHandleSelect(node)
}

function handleClickCard() {
  if (clickAudioRef.value?.paused) {
    clickAudioRef.value.play()
  }
  else if (clickAudioRef.value) {
    clickAudioRef.value.load()
    clickAudioRef.value.play()
  }
}

function handleDropCard() {
  dropAudioRef.value?.play()
}

function handleWin() {
  winAudioRef.value?.play()
  
  if (curLevel.value < LevelConfig.length) {
    basicCannon()
    showTip.value = true
    
    // 显示通关奖励界面
    setTimeout(() => {
      showTip.value = false
      if (isWalletConnected.value) {
        showRewardAfterWin.value = true
      } else {
        alert('请先连接Spark钱包才能获得奖励！')
      }
    }, 1500)
  }
  else {
    isWin.value = true
    schoolPride()
    // 最后一关也显示奖励界面
    setTimeout(() => {
      if (isWalletConnected.value) {
        showRewardAfterWin.value = true
      } else {
        alert('请先连接Spark钱包才能获得奖励！')
      }
    }, 2000)
  }
}

// 处理支付成功
function handlePaymentSuccess(paymentData: any) {
  console.log('支付成功:', paymentData)
  
  // 如果不是最后一关，继续下一关
  if (curLevel.value < LevelConfig.length) {
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 1000)
  }
}

// 处理钱包连接
function handleWalletConnected(walletData: any) {
  if (walletData) {
    isWalletConnected.value = true
    showSparkWallet.value = false // 新钱包连接后关闭界面
  } else {
    isWalletConnected.value = false
  }
}

// 关闭Spark钱包模态框
function closeSparkWallet() {
  showSparkWallet.value = false
}

// 关闭奖励模态框
function closeRewardModal() {
  showRewardAfterWin.value = false
}

function handleLose() {
  loseAudioRef.value?.play()
  setTimeout(() => {
    alert('槽位已满，再接再厉~')
    // window.location.reload()
    nodes.value = []
    removeList.value = []
    selectedNodes.value = []
    curLevel.value = 0
    showTip.value = true
    setTimeout(() => {
      showTip.value = false
    }, 1500)
    setTimeout(() => {
      initData(LevelConfig[curLevel.value])
      curLevel.value++
    }, 2000)
  }, 500)
}

// 检查钱包连接状态
function checkWalletConnection() {
  const savedAddress = localStorage.getItem('sparkAddress')
  const savedMnemonic = localStorage.getItem('sparkMnemonic')
  
  if (savedAddress && savedMnemonic) {
    isWalletConnected.value = true
  } else {
    isWalletConnected.value = false
  }
}

onMounted(() => {
  initLanguage()
  initData()
  checkWalletConnection()
  
  // 延迟再次检查钱包状态，确保SparkWallet组件也完成了初始化
  setTimeout(() => {
    checkWalletConnection()
  }, 1000)
  
  // 监听窗口大小变化，重新布局游戏
  window.addEventListener('resize', () => {
    setTimeout(() => {
      initData(LevelConfig[curLevel.value - 1])
    }, 100)
  })
  
})
</script>

<template>
  <div class="mobile-container" flex flex-col w-full h-full>
    <div class="game-header">
      <div class="game-title" text-center w-full fw-600 flex items-center justify-center>
        <div class="logo-container">
          <span class="title-text">
            <span class="bull-emoji">🐂</span>BULL
          </span>
        </div>
      </div>
      <div class="game-status">
        <div class="status-row">
          <span class="level-info">{{ t('level') }}: {{ curLevel }}/3</span>
          <span class="slot-info">{{ t('slot') }}: {{ selectedNodes.length }}/7</span>
          <span class="wallet-indicator" :class="{ 'connected': isWalletConnected }">
            {{ isWalletConnected ? t('walletConnected') : t('walletDisconnected') }}
          </span>
          <button @click="switchLanguage" class="lang-switch">
            {{ currentLanguage === 'zh' ? 'EN' : '中' }}
          </button>
        </div>
      </div>
    </div>
    
    <div ref="containerRef" flex-1 flex>
      <div w-full relative flex-1 class="game-container">
        <div class="game-board">
        <!-- 无钱包提示覆盖层 -->
        <div v-if="!isWalletConnected" class="no-wallet-overlay">
          <div class="no-wallet-message">
            <h3>🔒 {{ t('needConnectWallet') }}</h3>
            <p>{{ t('connectWalletFirst') }}</p>
            <button @click="showSparkWallet = true" class="connect-wallet-btn">
              💰 {{ t('connectWallet') }}
            </button>
          </div>
        </div>
        
        <!-- 游戏卡片 -->
        <template v-for="item in nodes" :key="item.id">
          <transition name="slide-fade">
            <Card
              v-if="[0, 1].includes(item.state)"
              :node="item"
              @click-card="handleSelect"
              :class="{ 'disabled-card': !isWalletConnected }"
            />
          </transition>
        </template>
        </div>
      </div>
      <transition name="bounce">
        <div v-if="isWin" class="win-message" color="#000" flex items-center justify-center w-full fw-bold>
          {{ t('winMessage') }}
        </div>
      </transition>
      <transition name="bounce">
        <div v-if="showTip" class="level-tip" color="#000" flex items-center justify-center w-full fw-bold>
          {{ t('level') }} {{ curLevel + 1 }}
        </div>
      </transition>
    </div>

    <div text-center h-50px flex items-center justify-center>
      <Card
        v-for="item in removeList" :key="item.id" :node="item"
        is-dock
        @click-card="handleSelectRemove"
      />
    </div>
    <div w-full flex items-center justify-center px-4>
      <div class="dock-container" flex>
        <template v-for="item in selectedNodes" :key="item.id">
          <transition name="bounce">
            <Card
              v-if="item.state === 2"
              :node="item"
              is-dock
            />
          </transition>
        </template>
      </div>
    </div>

    <div class="button-container" flex items-center w-full justify-center px-4>
      <button class="game-button" :disabled="removeFlag || !isWalletConnected" @click="handleRemove">
        {{ t('removeThree') }}
      </button>
      <button class="game-button" :disabled="backFlag || !isWalletConnected" @click="handleBack">
        {{ t('back') }}
      </button>
      <button class="game-button spark-btn" @click="showSparkWallet = true">
        {{ isWalletConnected ? t('rewardRecord') : t('connectWallet') }}
      </button>
    </div>
    <div w-full fw-600 text-center pb-10px flex style="display: flex;justify-content: center;align-items: center">
      <a
        class="social-link"
        rel="noreferrer"
        href="https://x.com/SparkBull35155"
        target="_blank"
        title="Follow us on X (Twitter)"
      >
        <span class="twitter-icon">𝕏</span>
      </a>
    </div>
    <audio
      ref="clickAudioRef"
      style="display: none;"
      controls
      src="./audio/click.mp3"
    />
    <audio
      ref="dropAudioRef"
      style="display: none;"
      controls
      src="./audio/drop.mp3"
    />
    <audio
      ref="winAudioRef"
      style="display: none;"
      controls
      src="./audio/win.mp3"
    />
    <audio
      ref="loseAudioRef"
      style="display: none;"
      controls
      src="./audio/lose.mp3"
    />

    <!-- Spark钱包组件 -->
    <SparkWallet 
      v-if="showSparkWallet"
      :current-level="curLevel"
      :show-reward-modal="false"
      :wallet-connected="isWalletConnected"
      @close-modal="closeSparkWallet"
      @payment-success="handlePaymentSuccess"
      @wallet-connected="handleWalletConnected"
    />

    <!-- 通关奖励组件（只在通关时显示） -->
    <SparkWallet 
      v-if="showRewardAfterWin"
      :current-level="curLevel"
      :show-reward-modal="true"
      :wallet-connected="isWalletConnected"
      @close-modal="closeRewardModal"
      @payment-success="handlePaymentSuccess"
      @wallet-connected="handleWalletConnected"
    />
  </div>
</template>

<style>
body{
  /* 选项1: 蓝紫渐变 */
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* 选项2: 绿色渐变 - 取消注释使用 */
  /* background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); */
  
  /* 选项3: 橙粉渐变 - 取消注释使用 */
  /* background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); */
  
  /* 选项4: 深色渐变 - 取消注释使用 */
  /* background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%); */
  
  /* 选项5: 暖色渐变 - 取消注释使用 */
  /* background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); */
  
  background-attachment: fixed;
}

/* 手机端背景优化 */
@media (max-width: 600px) {
  body {
    background: #f5f5f5;
  }
}

/* 自适应基准样式 */
.game-header {
  margin-bottom: clamp(10px, 2vh, 20px);
}

.game-title {
  height: clamp(60px, 15vh, 100px);
  margin-top: clamp(15px, 3vh, 35px);
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(8px, 2vw, 15px);
}

.title-text {
  font-size: clamp(32px, 8vw, 56px);
  color: #ffffff;
  font-weight: 800;
  letter-spacing: clamp(2px, 0.5vw, 4px);
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
  font-family: 'Arial Black', Arial, sans-serif;
  display: flex;
  align-items: center;
  gap: clamp(4px, 1vw, 8px);
  animation: logoFloat 3s ease-in-out infinite;
}

.bull-emoji {
  font-size: clamp(28px, 7vw, 48px);
  filter: drop-shadow(0 3px 6px rgba(0, 0, 0, 0.5));
}

@keyframes logoFloat {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(clamp(-3px, -0.8vw, -5px));
  }
}

.game-status {
  margin: clamp(5px, 1vh, 10px) clamp(10px, 2vw, 20px);
  padding: clamp(8px, 2vw, 12px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.95));
  border-radius: clamp(8px, 2vw, 12px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.level-info, .slot-info {
  font-size: clamp(12px, 2.5vw, 14px);
  color: #333;
  font-weight: 600;
}

.wallet-status {
  text-align: center;
}

.wallet-indicator {
  padding: clamp(3px, 0.8vw, 5px) clamp(8px, 2vw, 12px);
  border-radius: clamp(4px, 1vw, 6px);
  font-size: clamp(10px, 2vw, 12px);
  font-weight: 600;
  background: #ffcdd2;
  color: #c62828;
  transition: all 0.3s ease;
  display: inline-block;
}

.wallet-indicator.connected {
  background: #c8e6c9;
  color: #2e7d32;
}

.lang-switch {
  padding: clamp(2px, 0.5vw, 3px) clamp(6px, 1.5vw, 8px);
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: clamp(3px, 0.8vw, 5px);
  font-size: clamp(9px, 1.8vw, 11px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: clamp(25px, 8vw, 35px);
  text-align: center;
}

.lang-switch:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-1px);
}

.status-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: clamp(6px, 2vw, 12px);
}

.level-info, .slot-info {
  font-size: clamp(11px, 2.2vw, 13px);
  color: #333;
  font-weight: 600;
  padding: clamp(3px, 0.8vw, 5px) clamp(8px, 2vw, 12px);
  background: rgba(255, 255, 255, 0.9);
  border-radius: clamp(4px, 1vw, 6px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  min-width: clamp(40px, 12vw, 60px);
  text-align: center;
}

.game-container {
  overflow: visible;
  min-height: 300px;
  padding: clamp(10px, 3vw, 20px);
}

.game-board {
  position: relative;
  width: 100%;
  height: 100%;
}

/* 手机端游戏区域优化 */
@media (max-width: 600px) {
  .game-container {
    padding: 8px;
    min-height: 280px;
  }
  
  .game-board {
    min-height: 250px;
  }
  
  .game-status {
    margin: 3px 8px;
    padding: 6px 8px;
    max-width: 90vw;
    margin-left: auto;
    margin-right: auto;
  }
  
  .status-row {
    gap: 4px;
    justify-content: space-evenly;
  }
  
  .level-info, .slot-info {
    font-size: 9px;
    padding: 2px 6px;
    min-width: clamp(35px, 10vw, 45px);
    flex: 0 0 auto;
  }
  
  .wallet-indicator {
    padding: 2px 6px;
    font-size: 8px;
    flex: 0 0 auto;
    min-width: clamp(45px, 15vw, 60px);
  }
  
  .lang-switch {
    padding: 1px 4px;
    font-size: 7px;
    min-width: clamp(20px, 6vw, 25px);
  }
}

@media (max-width: 400px) {
  .game-status {
    margin: 2px 5px;
    padding: 4px 6px;
    max-width: 95vw;
  }
  
  .status-row {
    gap: 3px;
  }
  
  .level-info, .slot-info {
    font-size: 8px;
    padding: 2px 4px;
    min-width: clamp(30px, 8vw, 35px);
  }
  
  .wallet-indicator {
    font-size: 7px;
    padding: 2px 4px;
    min-width: clamp(35px, 12vw, 45px);
  }
}

.dock-container {
  width: clamp(220px, 70vw, 420px);
  height: clamp(38px, 8vh, 65px);
  min-height: clamp(38px, 8vh, 65px);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 249, 250, 0.9));
  border: 2px dashed rgba(102, 126, 234, 0.4);
  border-radius: clamp(6px, 1.5vw, 10px);
  backdrop-filter: blur(5px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 手机端dock容器优化 */
@media (max-width: 600px) {
  .dock-container {
    width: clamp(160px, 75vw, 280px);
    height: clamp(35px, 7vh, 50px);
    min-height: clamp(35px, 7vh, 50px);
    margin: 0 auto;
  }
}

@media (max-width: 400px) {
  .dock-container {
    width: clamp(140px, 80vw, 240px);
    height: clamp(32px, 6vh, 45px);
    min-height: clamp(32px, 6vh, 45px);
  }
}

@media (max-width: 320px) {
  .dock-container {
    width: clamp(120px, 85vw, 200px);
    height: clamp(30px, 5vh, 40px);
    min-height: clamp(30px, 5vh, 40px);
  }
}

.button-container {
  height: clamp(40px, 10vh, 80px);
  margin: clamp(8px, 2vh, 20px) 0;
  gap: clamp(8px, 2vw, 20px);
  flex-wrap: wrap;
  justify-content: center;
}

/* 手机端按钮优化 */
@media (max-width: 600px) {
  .button-container {
    gap: 5px;
    padding: 0 5px;
    margin: 8px 0;
    height: auto;
  }
  
  .game-button {
    flex: 1;
    min-width: 0;
    max-width: 105px;
    padding: 6px 3px;
    font-size: 11px;
    border-radius: 5px;
  }
  
  .spark-btn {
    flex: 1.1;
    max-width: 115px;
  }
}

@media (max-width: 400px) {
  .button-container {
    gap: 4px;
    padding: 0 5px;
  }
  
  .game-button {
    max-width: 100px;
    padding: 6px 2px;
    font-size: 11px;
  }
  
  .spark-btn {
    max-width: 110px;
  }
  
  .social-link {
    width: 32px;
    height: 32px;
  }
  
  .twitter-icon {
    font-size: 14px;
  }
}

.game-button {
  padding: clamp(8px, 2vw, 16px) clamp(12px, 5vw, 32px);
  font-size: clamp(13px, 3vw, 18px);
  border-radius: clamp(8px, 2vw, 12px);
  border: clamp(1px, 0.5vw, 2px) solid rgba(0, 0, 0, 0.2);
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  color: #495057;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.3s ease;
  min-width: clamp(75px, 20vw, 120px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3px, 1vw, 6px);
}


/* 只在大屏设备上启用悬停效果 */
@media (hover: hover) and (pointer: fine) {
  .game-button:hover {
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    transform: translateY(clamp(-2px, -0.8vw, -4px));
    box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(8px, 3vw, 16px) rgba(0, 0, 0, 0.15);
    border-color: rgba(0, 0, 0, 0.3);
  }
  
}

.spark-btn {
  background: linear-gradient(135deg, #667eea, #764ba2) !important;
  color: white !important;
  border-color: rgba(102, 126, 234, 0.3) !important;
  box-shadow: 0 3px 12px rgba(102, 126, 234, 0.3);
}

/* 只在大屏设备上启用Spark按钮悬停效果 */
@media (hover: hover) and (pointer: fine) {
  .spark-btn:hover {
    background: linear-gradient(135deg, #5a67d8, #6b46c1) !important;
    transform: translateY(clamp(-2px, -0.8vw, -4px));
    box-shadow: 0 clamp(4px, 1.5vw, 8px) clamp(12px, 4vw, 20px) rgba(102, 126, 234, 0.4);
    border-color: rgba(102, 126, 234, 0.5) !important;
  }
}

/* 无钱包覆盖层 */
.no-wallet-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: clamp(8px, 2vw, 12px);
  backdrop-filter: blur(5px);
}

.no-wallet-message {
  text-align: center;
  padding: clamp(20px, 5vw, 40px);
  background: white;
  border: 3px solid #000;
  border-radius: clamp(8px, 2vw, 12px);
  box-shadow: 4px 8px 8px -1px #000;
}

.no-wallet-message h3 {
  margin: 0 0 15px 0;
  color: #000;
  font-size: clamp(20px, 4vw, 28px);
}

.no-wallet-message p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: clamp(14px, 3vw, 16px);
}

.connect-wallet-btn {
  padding: clamp(12px, 3vw, 16px) clamp(24px, 5vw, 32px);
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: white;
  border: 3px solid #000;
  border-radius: clamp(8px, 2vw, 10px);
  font-size: clamp(16px, 3vw, 18px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connect-wallet-btn:hover {
  background: linear-gradient(135deg, #ff5722, #e68900);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(255, 107, 53, 0.4);
}

/* 禁用的卡片 */
.disabled-card {
  opacity: 0.5;
  pointer-events: none;
  filter: grayscale(50%);
}

/* 社交媒体链接 - 简洁图标 */
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(36px, 7vw, 42px);
  height: clamp(36px, 7vw, 42px);
  background: linear-gradient(135deg, #1da1f2, #0d8bd9);
  color: white;
  text-decoration: none;
  border-radius: 50%;
  border: 2px solid rgba(29, 161, 242, 0.3);
  box-shadow: 0 2px 8px rgba(29, 161, 242, 0.3);
  transition: all 0.3s ease;
}

.social-link:hover {
  background: linear-gradient(135deg, #0d8bd9, #0a7bc4);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 16px rgba(29, 161, 242, 0.5);
}

.twitter-icon {
  font-size: clamp(16px, 3.5vw, 20px);
  font-weight: bold;
}

.game-button:active {
  transform: translateY(0);
}

.game-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.win-message, .level-tip {
  font-size: clamp(18px, 6vw, 36px);
}

/* 移除所有固定断点，使用完全自适应的流体设计 */

/* 自适应容器样式 */
.mobile-container {
  max-width: clamp(320px, 90vw, 600px);
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  min-height: 100vh;
  padding: 0 clamp(5px, 2vw, 20px);
  backdrop-filter: blur(10px);
  border-radius: clamp(0px, 2vw, 20px);
  box-shadow: 0 0 clamp(20px, 4vw, 40px) rgba(0, 0, 0, 0.3);
}

/* 手机端全屏优化 */
@media (max-width: 600px) {
  .mobile-container {
    max-width: 100vw;
    background: rgba(255, 255, 255, 0.98);
    border-radius: 0;
    box-shadow: none;
    backdrop-filter: blur(0px);
    padding: 0 clamp(5px, 1vw, 8px);
  }
}

/* 大屏设备优化 */
@media (min-width: 600px) {
  .mobile-container {
    box-shadow: 0 0 clamp(25px, 5vw, 50px) rgba(0, 0, 0, 0.4);
    border-radius: clamp(15px, 3vw, 25px);
    margin-top: clamp(20px, 3vh, 40px);
    margin-bottom: clamp(20px, 3vh, 40px);
  }
  
  .game-title {
    margin-top: clamp(20px, 4vh, 40px);
  }
  
  .button-container {
    margin: clamp(15px, 3vh, 25px) 0;
    gap: clamp(15px, 3vw, 25px);
  }
}

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(25vh);
  opacity: 0;
}

.v-enter-active,
.v-leave-active {
  transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>
