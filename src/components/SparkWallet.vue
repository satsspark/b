<template>
  <div class="spark-wallet-container">
    <!-- 钱包未连接时显示连接选项 -->
    <div v-if="!props.walletConnected && !isWalletConnected && !showCreateWallet && !showImportWallet && !showRewardModal" class="wallet-connect">
      <h3>{{ t('sparkWallet') }}</h3>
      <p>{{ t('createNewWallet') }}</p>
      
      <div class="wallet-options">
        <button @click="showCreateWallet = true" class="wallet-option-btn create-btn">
          {{ t('createWallet') }}
        </button>
        <button @click="showImportWallet = true" class="wallet-option-btn import-btn">
          {{ t('importWallet') }}
        </button>
      </div>
      
      <div v-if="walletError" class="error-message">
        {{ walletError }}
      </div>
    </div>

    <!-- 创建钱包界面 -->
    <div v-if="showCreateWallet" class="create-wallet-modal">
      <h3>{{ t('createWallet') }}</h3>
      <div v-if="!newMnemonic" class="create-step">
        <p>{{ t('clickToGenerate') }}</p>
        <button @click="generateWallet" :disabled="isCreating" class="generate-btn">
          {{ isCreating ? t('generating') : t('generateWallet') }}
        </button>
      </div>
      
      <div v-else class="mnemonic-display">
        <p><strong>⚠️ {{ t('saveMnemonic') }}</strong></p>
        <div class="mnemonic-words">
          <span v-for="(word, index) in newMnemonic.split(' ')" :key="index" class="mnemonic-word">
            {{ index + 1 }}. {{ word }}
          </span>
        </div>
        <div class="mnemonic-actions">
            <button @click="copyMnemonic" class="copy-btn">{{ t('copyMnemonic') }}</button>
            <button @click="confirmCreateWallet" class="confirm-btn">{{ t('saved') }}</button>
        </div>
      </div>
      
      <button @click="cancelCreate" class="cancel-btn">{{ t('cancel') }}</button>
    </div>

    <!-- 导入钱包界面 -->
    <div v-if="showImportWallet" class="import-wallet-modal">
      <h3>{{ t('importWallet') }}</h3>
      <div class="import-form">
        <label>{{ t('importMnemonicLabel') }}</label>
        <textarea 
          v-model="importMnemonic"
          :placeholder="t('importMnemonicPlaceholder')"
          class="mnemonic-input"
          rows="3"
        ></textarea>
        <div class="import-actions">
          <button @click="importWallet" :disabled="!isImportValid || isImporting" class="import-btn">
            {{ isImporting ? t('importing') : t('importWalletBtn') }}
          </button>
          <button @click="cancelImport" class="cancel-btn">{{ t('cancel') }}</button>
        </div>
      </div>
    </div>

    <!-- 钱包已连接时显示奖励记录 -->
    <div v-if="(props.walletConnected || isWalletConnected) && !showRewardModal && !showCreateWallet && !showImportWallet" class="reward-history-view">
      <div class="wallet-header">
        <h3>{{ t('walletRewards') }}</h3>
        <div class="wallet-info">
          <div class="address-section">
            <p class="address">{{ formatAddress(userSparkAddress) }}</p>
            <button @click="copyAddress" class="copy-address-btn">{{ t('copy') }}</button>
          </div>
          <p class="balance">💰 {{ t('balance') }}: {{ walletBalance.toString() }} {{ t('sats') }}</p>
          <div class="wallet-actions">
            <button @click="refreshBalance" class="refresh-btn">{{ t('refresh') }}</button>
            <button @click="disconnectWallet" class="disconnect-btn">{{ t('disconnect') }}</button>
          </div>
        </div>
      </div>

      <div class="rewards-section">
        <div v-if="rewardHistory.length === 0" class="no-rewards">
          <p>{{ t('noRewards') }}</p>
          <p>{{ t('completeGame') }}</p>
        </div>
        <div v-else class="rewards-list">
          <div v-for="reward in rewardHistory" :key="reward.timestamp" class="reward-item">
            <div class="reward-header">
              <span class="level-badge">{{ getLevelDescription(reward.level) }}</span>
              <span class="reward-amount">+{{ reward.reward }} BULL</span>
            </div>
            <div class="reward-details">
              <p>{{ t('needPay') }}: {{ reward.paymentAmount }} {{ t('sats') }}</p>
              <p>{{ t('time') }}: {{ formatDate(reward.timestamp) }}</p>
            </div>
          </div>
        </div>
        <div v-if="rewardHistory.length > 0" class="total-rewards">
          <p><strong>{{ t('totalReward') }}: {{ totalRewards }} BULL</strong></p>
        </div>
      </div>
      
      <div class="close-action">
        <button @click="closeWallet" class="close-btn">{{ t('close') }}</button>
      </div>
    </div>

    <!-- 通关奖励界面（只在游戏通关时显示） -->
    <div v-if="showRewardModal && isWalletConnected" class="reward-modal">
      <h3>{{ t('congratulations') }}</h3>
      <div class="reward-info">
        <p><strong>{{ getLevelDescription(currentLevel) }}{{ t('levelCompleted') }}</strong></p>
        <p>{{ t('needPay') }}: <span class="payment-amount">{{ levelConfig[currentLevel - 1].paymentSats }} {{ t('sats') }}</span></p>
        <p>{{ t('reward') }}: <span class="reward-amount">{{ levelConfig[currentLevel - 1].rewardBull }} BULL</span></p>
        <p class="payment-address">{{ t('receiveAddress') }}: {{ levelConfig[currentLevel - 1].receiveAddress }}</p>
      </div>
      
      <div class="payment-status">
        <div v-if="paymentStatus === 'pending'" class="status-pending">
          <div class="loading-spinner"></div>
          <p>{{ t('processing') }}</p>
        </div>
        <div v-else-if="paymentStatus === 'success'" class="status-success">
          <p>{{ t('paymentSuccess') }}</p>
        </div>
        <div v-else-if="paymentStatus === 'failed'" class="status-failed">
          <p>{{ walletError || t('paymentFailed') }}</p>
        </div>
      </div>

      <div class="modal-actions">
        <button 
          @click="submitPayment" 
          :disabled="paymentStatus === 'pending'"
          class="submit-btn"
        >
          {{ paymentStatus === 'pending' ? t('processing') : t('confirmPayment') }}
        </button>
        <button @click="closeRewardModal" class="cancel-btn">{{ t('cancel') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SparkWallet } from '@buildonspark/spark-sdk'
import { t, getLevelOrdinal, getLevelDescription } from '../i18n'

// Props
const props = withDefaults(defineProps<{
  currentLevel?: number
  showRewardModal?: boolean
  walletConnected?: boolean
}>(), {
  currentLevel: 1,
  showRewardModal: false,
  walletConnected: false
})

// Emits
const emit = defineEmits(['close-modal', 'payment-success', 'wallet-connected'])

// 钱包实例
const sparkWallet = ref<SparkWallet | null>(null)

// 钱包状态
const isWalletConnected = ref(false)
const userSparkAddress = ref('')
const walletBalance = ref<bigint>(0n)
const walletError = ref('')

// 创建钱包状态
const showCreateWallet = ref(false)
const showImportWallet = ref(false)
const isCreating = ref(false)
const isImporting = ref(false)
const newMnemonic = ref('')

// 导入钱包状态
const importMnemonic = ref('')
const isImportValid = computed(() => {
  const words = importMnemonic.value.trim().split(/\s+/)
  return words.length === 12 && words.every(word => word.length > 0)
})

// 支付状态
const paymentStatus = ref<'idle' | 'pending' | 'success' | 'failed'>('idle')

// 奖励历史
const rewardHistory = ref<any[]>([])
const totalRewards = ref(0)

// 关卡配置
const levelConfig = [
  {
    level: 1,
    paymentSats: 21,
    rewardBull: 1000,
    receiveAddress: 'sp1pgssysqqtx7cn0vfqa7ujgvd7qjjgm5npkkpl5x9mtzlv47rfv58kzykm8zzu0'
  },
  {
    level: 2,
    paymentSats: 42,
    rewardBull: 3000,
    receiveAddress: 'sp1pgssysqqtx7cn0vfqa7ujgvd7qjjgm5npkkpl5x9mtzlv47rfv58kzykm8zzu0'
  },
  {
    level: 3,
    paymentSats: 84,
    rewardBull: 6000,
    receiveAddress: 'sp1pgssysqqtx7cn0vfqa7ujgvd7qjjgm5npkkpl5x9mtzlv47rfv58kzykm8zzu0'
  }
]

// 生成新钱包
async function generateWallet() {
  isCreating.value = true
  walletError.value = ''
  
  try {
    console.log('开始生成新钱包...')
    const result = await SparkWallet.initialize({
      options: {
        network: 'MAINNET' // 确保连接到主网
      }
    })
    
    sparkWallet.value = result.wallet
    newMnemonic.value = result.mnemonic || ''
    
    console.log('钱包生成成功，网络: MAINNET')
  } catch (error) {
    console.error('生成钱包失败:', error)
    walletError.value = t('generateFailed')
  } finally {
    isCreating.value = false
  }
}

// 复制助记词
async function copyMnemonic() {
  try {
    await navigator.clipboard.writeText(newMnemonic.value)
    alert(t('mnemonicCopied'))
  } catch (error) {
    console.error('复制失败:', error)
    const textArea = document.createElement('textarea')
    textArea.value = newMnemonic.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert(t('mnemonicCopied'))
  }
}

// 确认创建钱包
async function confirmCreateWallet() {
  if (!sparkWallet.value) return
  
  try {
    const address = await sparkWallet.value.getSparkAddress()
    userSparkAddress.value = typeof address === 'string' ? address : (address as any).address
    
    const balance = await sparkWallet.value.getBalance()
    walletBalance.value = balance.balance
    
    localStorage.setItem('sparkMnemonic', newMnemonic.value)
    localStorage.setItem('sparkAddress', userSparkAddress.value)
    
    isWalletConnected.value = true
    showCreateWallet.value = false
    newMnemonic.value = ''
    
    loadRewardHistory()
    emit('wallet-connected', { address: userSparkAddress.value, balance: walletBalance.value })
  } catch (error) {
    console.error('确认创建钱包失败:', error)
    walletError.value = t('generateFailed')
  }
}

// 导入钱包
async function importWallet() {
  if (!isImportValid.value) return
  
  isImporting.value = true
  walletError.value = ''
  
  try {
    console.log('开始导入钱包...')
    const result = await SparkWallet.initialize({
      mnemonicOrSeed: importMnemonic.value.trim(),
      options: {
        network: 'MAINNET' // 确保连接到主网
      }
    })
    
    sparkWallet.value = result.wallet
    
    const address = await sparkWallet.value.getSparkAddress()
    userSparkAddress.value = typeof address === 'string' ? address : (address as any).address
    
    const balance = await sparkWallet.value.getBalance()
    walletBalance.value = balance.balance
    
    localStorage.setItem('sparkMnemonic', importMnemonic.value.trim())
    localStorage.setItem('sparkAddress', userSparkAddress.value)
    
    isWalletConnected.value = true
    showImportWallet.value = false
    importMnemonic.value = ''
    
    loadRewardHistory()
    emit('wallet-connected', { address: userSparkAddress.value, balance: walletBalance.value })
  } catch (error) {
    console.error('导入钱包失败:', error)
    walletError.value = t('importFailed')
  } finally {
    isImporting.value = false
  }
}

// 断开钱包连接
async function disconnectWallet() {
  try {
    if (sparkWallet.value) {
      await sparkWallet.value.cleanupConnections()
    }
  } catch (error) {
    console.error('清理连接失败:', error)
  }
  
  localStorage.removeItem('sparkMnemonic')
  localStorage.removeItem('sparkAddress')
  sparkWallet.value = null
  isWalletConnected.value = false
  userSparkAddress.value = ''
  walletBalance.value = 0n
  rewardHistory.value = []
  totalRewards.value = 0
  
  emit('wallet-connected', null)
}

// 取消创建
function cancelCreate() {
  showCreateWallet.value = false
  newMnemonic.value = ''
  if (sparkWallet.value) {
    sparkWallet.value.cleanupConnections().catch(console.error)
    sparkWallet.value = null
  }
}

// 取消导入
function cancelImport() {
  showImportWallet.value = false
  importMnemonic.value = ''
}

// 刷新余额
async function refreshBalance() {
  if (!sparkWallet.value) return
  
  try {
    const balance = await sparkWallet.value.getBalance()
    walletBalance.value = balance.balance
    console.log(t('balanceRefreshed'), walletBalance.value.toString(), t('sats'))
  } catch (error) {
    console.error(t('refreshFailed'), error)
  }
}

// 复制地址
async function copyAddress() {
  try {
    await navigator.clipboard.writeText(userSparkAddress.value)
    alert(t('addressCopied'))
  } catch (error) {
    console.error('复制失败:', error)
    const textArea = document.createElement('textarea')
    textArea.value = userSparkAddress.value
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    alert(t('addressCopied'))
  }
}

// 关闭钱包界面
function closeWallet() {
  emit('close-modal')
}

// 格式化地址显示
function formatAddress(address: string) {
  if (!address) return ''
  return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
}

// 提交支付
async function submitPayment() {
  if (!isWalletConnected.value || !sparkWallet.value) return
  
  paymentStatus.value = 'pending'
  
  try {
    const currentLevelConfig = levelConfig[props.currentLevel - 1]
    
    console.log('开始Spark转账...')
    console.log('从地址:', userSparkAddress.value)
    console.log('到地址:', currentLevelConfig.receiveAddress)
    console.log('金额:', currentLevelConfig.paymentSats, 'sats')
    
    // 检查余额
    const balance = await sparkWallet.value.getBalance()
    if (balance.balance < BigInt(currentLevelConfig.paymentSats)) {
      throw new Error(`${t('insufficientBalance')}: ${balance.balance} ${t('sats')}，${t('required')}: ${currentLevelConfig.paymentSats} ${t('sats')}`)
    }
    
    // 执行转账
    const transferResult = await sparkWallet.value.transfer({
      receiverSparkAddress: currentLevelConfig.receiveAddress,
      amountSats: currentLevelConfig.paymentSats
    })
    
    console.log('转账成功:', transferResult)
    paymentStatus.value = 'success'
    
    // 更新余额
    const newBalance = await sparkWallet.value.getBalance()
    walletBalance.value = newBalance.balance
    
    // 保存奖励记录
    const rewards = JSON.parse(localStorage.getItem('sparkRewards') || '[]')
    rewards.push({
      level: props.currentLevel,
      reward: currentLevelConfig.rewardBull,
      paymentAmount: currentLevelConfig.paymentSats,
      userAddress: userSparkAddress.value,
      receiveAddress: currentLevelConfig.receiveAddress,
      transferId: transferResult.id,
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('sparkRewards', JSON.stringify(rewards))
    
    // 重新加载奖励历史
    loadRewardHistory()
    
    emit('payment-success', {
      level: props.currentLevel,
      reward: currentLevelConfig.rewardBull,
      paymentAmount: currentLevelConfig.paymentSats,
      transferId: transferResult.id
    })
    
    // 2秒后自动关闭模态框
    setTimeout(() => {
      closeRewardModal()
    }, 2000)
    
  } catch (error) {
    console.error('转账失败:', error)
    paymentStatus.value = 'failed'
    walletError.value = error instanceof Error ? error.message : '转账失败，请重试'
  }
}

// 关闭奖励模态框
function closeRewardModal() {
  paymentStatus.value = 'idle'
  walletError.value = ''
  emit('close-modal')
}

// 格式化日期
function formatDate(timestamp: string) {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// 加载奖励历史
function loadRewardHistory() {
  const rewards = JSON.parse(localStorage.getItem('sparkRewards') || '[]')
  rewardHistory.value = rewards.reverse() // 最新的在前面
  totalRewards.value = rewards.reduce((sum: number, reward: any) => sum + reward.reward, 0)
}

// 初始化钱包
async function initializeWallet() {
  const savedMnemonic = localStorage.getItem('sparkMnemonic')
  const savedAddress = localStorage.getItem('sparkAddress')
  
  if (savedMnemonic && savedAddress) {
    try {
      console.log('恢复已保存的钱包...')
      const result = await SparkWallet.initialize({
        mnemonicOrSeed: savedMnemonic,
        options: {
          network: 'MAINNET' // 确保连接到主网
        }
      })
      
      sparkWallet.value = result.wallet
      userSparkAddress.value = savedAddress
      
      // 验证地址是否正确
      const currentAddress = await sparkWallet.value.getSparkAddress()
      const actualAddress = typeof currentAddress === 'string' ? currentAddress : (currentAddress as any).address
      
      if (actualAddress !== savedAddress) {
        console.log('地址不匹配，更新保存的地址')
        userSparkAddress.value = actualAddress
        localStorage.setItem('sparkAddress', actualAddress)
      }
      
      // 获取最新余额
      const balance = await sparkWallet.value.getBalance()
      walletBalance.value = balance.balance
      
      isWalletConnected.value = true
      // 初始化恢复钱包时不发送连接事件，避免影响界面显示
    } catch (error) {
      console.error('恢复钱包失败:', error)
      // 清理损坏的数据
      localStorage.removeItem('sparkMnemonic')
      localStorage.removeItem('sparkAddress')
    }
  }
  
  loadRewardHistory()
}

// 组件挂载时初始化
initializeWallet()
</script>

<style scoped>
.spark-wallet-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: clamp(10px, 3vw, 20px);
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(5px);
  }
}

.wallet-connect,
.create-wallet-modal,
.import-wallet-modal,
.reward-history-view,
.reward-modal {
  background: #f9f7e1;
  padding: clamp(20px, 5vw, 40px);
  border-radius: clamp(8px, 2vw, 16px);
  border: 3px solid #000;
  box-shadow: 4px 8px 8px -1px #000;
  max-width: clamp(300px, 80vw, 500px);
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.wallet-connect h3,
.create-wallet-modal h3,
.import-wallet-modal h3 {
  margin: 0 0 15px 0;
  color: #000;
  font-size: clamp(20px, 4vw, 28px);
  text-align: center;
  font-weight: bold;
}

.wallet-connect p,
.create-wallet-modal p,
.import-wallet-modal p {
  margin: 0 0 20px 0;
  color: #333;
  font-size: clamp(14px, 3vw, 16px);
  text-align: center;
  font-weight: 500;
}

.wallet-header {
  margin-bottom: 20px;
  text-align: center;
}

.wallet-header h3 {
  margin: 0 0 15px 0;
  color: #000;
  font-size: clamp(20px, 4vw, 28px);
}

.wallet-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #000;
  margin-bottom: 15px;
}

.address-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 5px;
}

.address {
  margin: 0;
  font-family: monospace;
  font-size: clamp(10px, 2vw, 12px);
  color: #000;
  flex: 1;
  font-weight: 600;
}

.copy-address-btn {
  padding: clamp(6px, 1.5vw, 8px) clamp(10px, 2vw, 12px);
  background: linear-gradient(135deg, #FF9800, #F57C00);
  color: white;
  border: 2px solid #E65100;
  border-radius: clamp(4px, 1vw, 6px);
  font-size: clamp(10px, 2vw, 12px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-address-btn:hover {
  background: linear-gradient(135deg, #F57C00, #E65100);
  transform: translateY(-1px);
  box-shadow: 0 3px 6px rgba(255, 152, 0, 0.3);
}

.balance {
  margin: 5px 0 10px 0;
  font-weight: bold;
  font-size: clamp(12px, 2.5vw, 14px);
  color: #2e7d32;
}

.wallet-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.refresh-btn, .disconnect-btn {
  padding: clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px);
  color: white;
  border: 2px solid #000;
  border-radius: clamp(4px, 1vw, 6px);
  font-size: clamp(11px, 2vw, 13px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  border-color: #1565C0;
}

.refresh-btn:hover {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  transform: translateY(-1px);
}

.disconnect-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  border-color: #c62828;
}

.disconnect-btn:hover {
  background: linear-gradient(135deg, #d32f2f, #c62828);
  transform: translateY(-1px);
}

.rewards-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  border: 2px solid #000;
}

.no-rewards {
  text-align: center;
  padding: 20px;
  color: #666;
}

.rewards-list {
  max-height: 300px;
  overflow-y: auto;
}

.reward-item {
  background: #f0f0f0;
  border: 2px solid #000;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 10px;
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.level-badge {
  background: #2196f3;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: bold;
}

.reward-amount {
  color: #4CAF50;
  font-weight: bold;
  font-size: 12px;
}

.reward-details p {
  margin: 2px 0;
  font-size: 11px;
  color: #333;
  font-weight: 500;
}

.total-rewards {
  background: #e8f5e8;
  border: 2px solid #4CAF50;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  margin-top: 15px;
}

.total-rewards p {
  margin: 0;
  color: #2e7d32;
  font-size: 14px;
  font-weight: bold;
}

.close-action {
  text-align: center;
  margin-top: 20px;
}

.close-btn {
  padding: 12px 24px;
  background: #666;
  color: white;
  border: 2px solid #000;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #555;
  transform: translateY(-2px);
}

/* 钱包选项按钮 */
.wallet-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.wallet-option-btn {
  padding: clamp(14px, 3vw, 18px);
  border: 2px solid #000;
  border-radius: clamp(8px, 2vw, 12px);
  font-size: clamp(16px, 3.5vw, 18px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.create-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border-color: #2e7d32;
}

.create-btn:hover {
  background: linear-gradient(135deg, #45a049, #388e3c);
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(76, 175, 80, 0.3);
}

.import-btn {
  background: linear-gradient(135deg, #2196F3, #1976D2);
  color: white;
  border-color: #1565C0;
}

.import-btn:hover {
  background: linear-gradient(135deg, #1976D2, #1565C0);
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(33, 150, 243, 0.3);
}

/* 助记词显示 */
.mnemonic-words {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 15px 0;
  padding: 15px;
  background: white;
  border: 2px solid #000;
  border-radius: 8px;
}

.mnemonic-word {
  padding: 5px 8px;
  background: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 10px;
  text-align: center;
}

.mnemonic-actions, .import-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.copy-btn, .confirm-btn, .generate-btn, .import-btn, .cancel-btn {
  padding: 12px 20px;
  border: 2px solid #000;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-btn {
  background: #FF9800;
  color: white;
}

.confirm-btn {
  background: #4CAF50;
  color: white;
}

.generate-btn {
  background: #2196F3;
  color: white;
  width: 100%;
}

.import-btn {
  background: #4CAF50;
  color: white;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.mnemonic-input {
  width: 100%;
  padding: 15px;
  border: 2px solid #000;
  border-radius: 8px;
  font-size: 14px;
  font-family: monospace;
  resize: vertical;
  margin: 10px 0;
}

/* 奖励模态框样式 */
.reward-info {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #000;
  margin-bottom: 20px;
}

.reward-info p {
  margin: 8px 0;
  color: #000;
  font-size: 14px;
}

.payment-amount {
  color: #f44336;
  font-weight: bold;
}

.payment-address {
  font-family: monospace;
  font-size: 10px;
  word-break: break-all;
  background: #f0f0f0;
  padding: 5px;
  border-radius: 4px;
}

.payment-status {
  margin: 20px 0;
  text-align: center;
}

.status-pending, .status-success, .status-failed {
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
  border: 2px solid #ffeaa7;
}

.status-success {
  background: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.status-failed {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #856404;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.submit-btn {
  padding: 15px 30px;
  background: #4CAF50;
  color: white;
  border: 2px solid #000;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  font-size: 12px;
  margin-top: 10px;
  text-align: center;
  padding: 10px;
  background: #ffebee;
  border-radius: 6px;
  border: 1px solid #f44336;
}

/* 手机端优化 */
@media (max-width: 480px) {
  .spark-wallet-container {
    padding: 15px;
  }
  
  .wallet-connect,
  .create-wallet-modal,
  .import-wallet-modal,
  .reward-history-view,
  .reward-modal {
    padding: 20px;
    border-radius: 12px;
    max-height: 85vh;
  }
  
  .wallet-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .refresh-btn, .disconnect-btn {
    width: 100%;
    padding: 10px;
    font-size: 14px;
  }
  
  .mnemonic-words {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  
  .mnemonic-actions, .import-actions, .modal-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .copy-btn, .confirm-btn, .generate-btn, .import-btn, .submit-btn, .cancel-btn {
    width: 100%;
    padding: 12px;
    font-size: 16px;
  }
  
  .address-section {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .copy-address-btn {
    width: 100%;
    padding: 8px;
    font-size: 12px;
  }
  
  .wallet-options {
    gap: 12px;
  }
  
  .wallet-option-btn {
    padding: 16px;
    font-size: 16px;
  }
}

</style>
