import { ref } from 'vue'

// 语言类型
export type Language = 'zh' | 'en'

// 当前语言状态
export const currentLanguage = ref<Language>('zh')

// 翻译文本
const translations = {
  zh: {
    // 游戏相关
    gameTitle: 'BULL',
    level: '关卡',
    slot: '槽位',
    walletConnected: '已连接',
    walletDisconnected: '未连接',
    removeThree: '移出三个',
    back: '回退',
    rewardRecord: '奖励记录',
    connectWallet: '连接钱包',
    
    // 钱包相关
    sparkWallet: 'Spark钱包',
    createWallet: '创建新钱包',
    importWallet: '导入钱包',
    createNewWallet: '创建或导入钱包来开始游戏',
    generateWallet: '生成钱包',
    generating: '生成中...',
    importing: '导入中...',
    saveMnemonic: '请安全保存您的助记词！',
    copyMnemonic: '复制助记词',
    saved: '我已保存',
    cancel: '取消',
    clickToGenerate: '点击下面按钮生成新的助记词',
    mnemonicCopied: '助记词已复制到剪贴板',
    addressCopied: '地址已复制到剪贴板',
    generateFailed: '生成钱包失败，请重试',
    importFailed: '导入钱包失败，请检查助记词是否正确',
    balanceRefreshed: '余额已刷新',
    refreshFailed: '刷新余额失败',
    
    // 导入钱包
    importMnemonicLabel: '输入助记词（12个单词，用空格分隔）：',
    importMnemonicPlaceholder: '输入您的12个助记词，用空格分隔...',
    importWalletBtn: '导入钱包',
    
    // 钱包信息
    walletRewards: 'Spark钱包奖励',
    balance: '余额',
    sats: 'sats',
    refresh: '刷新',
    disconnect: '断开连接',
    copy: '复制',
    close: '关闭',
    
    // 奖励相关
    congratulations: '恭喜通关！',
    levelCompleted: '关完成',
    needPay: '需要支付',
    reward: '奖励',
    receiveAddress: '收款地址',
    confirmPayment: '确认支付',
    processing: '处理中...',
    paymentSuccess: '支付成功！奖励已发送',
    paymentFailed: '支付失败，请重试',
    totalReward: '总奖励',
    noRewards: '暂无奖励记录',
    completeGame: '完成游戏关卡即可获得BULL奖励！',
    
    // 游戏状态
    needConnectWallet: '需要连接钱包',
    connectWalletFirst: '请先连接Spark钱包才能开始游戏',
    gameOver: '槽位已满，再接再厉~',
    winMessage: '成功加入兔圈~',
    
    // 数字和序号
    first: '第一',
    second: '第二',
    third: '第三',
    
    // 错误消息
    insufficientBalance: '余额不足。当前余额',
    required: '需要',
    
    // 其他
    createBy: 'Create By: summer-is-hot',
    time: '时间'
  },
  en: {
    // Game related
    gameTitle: 'BULL',
    level: 'Level',
    slot: 'Slot',
    walletConnected: 'Connected',
    walletDisconnected: 'Disconnected',
    removeThree: 'Remove 3',
    back: 'Back',
    rewardRecord: 'Rewards',
    connectWallet: 'Connect Wallet',
    
    // Wallet related
    sparkWallet: 'Spark Wallet',
    createWallet: 'Create New Wallet',
    importWallet: 'Import Wallet',
    createNewWallet: 'Create or import wallet to start playing',
    generateWallet: 'Generate Wallet',
    generating: 'Generating...',
    importing: 'Importing...',
    saveMnemonic: 'Please save your mnemonic phrase safely!',
    copyMnemonic: 'Copy Mnemonic',
    saved: 'I have saved',
    cancel: 'Cancel',
    clickToGenerate: 'Click the button below to generate new mnemonic',
    mnemonicCopied: 'Mnemonic copied to clipboard',
    addressCopied: 'Address copied to clipboard',
    generateFailed: 'Failed to generate wallet, please try again',
    importFailed: 'Failed to import wallet, please check your mnemonic',
    balanceRefreshed: 'Balance refreshed',
    refreshFailed: 'Failed to refresh balance',
    
    // Import wallet
    importMnemonicLabel: 'Enter mnemonic (12 words separated by spaces):',
    importMnemonicPlaceholder: 'Enter your 12 mnemonic words separated by spaces...',
    importWalletBtn: 'Import Wallet',
    
    // Wallet info
    walletRewards: 'Spark Wallet Rewards',
    balance: 'Balance',
    sats: 'sats',
    refresh: 'Refresh',
    disconnect: 'Disconnect',
    copy: 'Copy',
    close: 'Close',
    
    // Rewards
    congratulations: 'Congratulations!',
    levelCompleted: 'Level Completed',
    needPay: 'Payment Required',
    reward: 'Reward',
    receiveAddress: 'Receive Address',
    confirmPayment: 'Confirm Payment',
    processing: 'Processing...',
    paymentSuccess: 'Payment successful! Reward sent',
    paymentFailed: 'Payment failed, please try again',
    totalReward: 'Total Rewards',
    noRewards: 'No reward records',
    completeGame: 'Complete game levels to earn BULL rewards!',
    
    // Game status
    needConnectWallet: 'Connect Wallet Required',
    connectWalletFirst: 'Please connect Spark wallet to start playing',
    gameOver: 'Slots full, try again~',
    winMessage: 'Successfully joined the community~',
    
    // Numbers and ordinals
    first: 'First',
    second: 'Second', 
    third: 'Third',
    
    // Error messages
    insufficientBalance: 'Insufficient balance. Current balance',
    required: 'required',
    
    // Others
    createBy: 'Create By: summer-is-hot',
    time: 'Time'
  }
}

// 翻译函数
export function t(key: string): string {
  const keys = key.split('.')
  let value: any = translations[currentLanguage.value]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
}

// 获取关卡序号翻译
export function getLevelOrdinal(level: number): string {
  const ordinals = {
    zh: ['', '第一', '第二', '第三'],
    en: ['', 'First', 'Second', 'Third']
  }
  return ordinals[currentLanguage.value][level] || `${t('level')} ${level}`
}

// 获取完整的关卡描述
export function getLevelDescription(level: number): string {
  if (currentLanguage.value === 'zh') {
    return `${getLevelOrdinal(level)}关`
  } else {
    return `${getLevelOrdinal(level)} Level`
  }
}

// 切换语言
export function switchLanguage() {
  currentLanguage.value = currentLanguage.value === 'zh' ? 'en' : 'zh'
  localStorage.setItem('language', currentLanguage.value)
}

// 初始化语言
export function initLanguage() {
  const savedLang = localStorage.getItem('language') as Language
  if (savedLang && ['zh', 'en'].includes(savedLang)) {
    currentLanguage.value = savedLang
  }
}
