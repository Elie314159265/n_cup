# AR音声会話仕様

## 概要

マッチングした相手のAIアバターと**音声のみ**でリアルタイム会話を行う。
テキスト入力は不可。完全音声ベースのコミュニケーション。

## フロー

### 1. AR会話セッション開始

```typescript
// ARセッション作成
const session = await createArSession({
  conversation_id: conversationId,
  environment_type: 'cafe',  // or 'park', 'beach'
})

// 相手のプロフィール情報を取得
const partnerProfile = await getPartnerProfile(matchId)

// ARアバターを表示
loadArAvatar(partnerProfile.ar_avatar)
```

### 2. 音声入力（ユーザーが話す）

```typescript
// マイク録音開始
const startRecording = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  mediaRecorder = new MediaRecorder(stream)

  mediaRecorder.ondataavailable = async (event) => {
    const audioBlob = event.data
    await processVoiceInput(audioBlob)
  }

  mediaRecorder.start()
}

// 録音停止
const stopRecording = () => {
  mediaRecorder.stop()
}
```

### 3. 音声処理パイプライン

```typescript
const processVoiceInput = async (audioBlob: Blob) => {
  try {
    // 1. 音声→テキスト変換（Amazon Transcribe）
    const transcribedText = await transcribeAudio(audioBlob)

    // 2. AI会話リクエスト（相手のプロフィール情報を渡す）
    const aiResponse = await fetchAiChat({
      message: transcribedText,
      ar_session_id: sessionId,
      partner_user_id: partnerUserId,
    })

    // 3. テキスト→音声変換（Amazon Polly）
    const audioUrl = await textToSpeech({
      text: aiResponse.text,
      voice_id: partnerProfile.ar_avatar.voice_id || 'Mizuki',
    })

    // 4. 音声再生 + アバター口パク同期
    await playAudioWithLipSync(audioUrl, arAvatar)

  } catch (error) {
    console.error('Voice processing error:', error)
    showErrorMessage('音声処理に失敗しました')
  }
}
```

### 4. API呼び出し

```typescript
// AI会話API
const fetchAiChat = async (params: {
  message: string
  ar_session_id: string
  partner_user_id: number
}) => {
  const response = await fetch('/api/v1/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      ar_session_id: params.ar_session_id,
      message: params.message,
      context: {
        partner_user_id: params.partner_user_id,
      }
    })
  })

  return await response.json()
}

// 音声認識API
const transcribeAudio = async (audioBlob: Blob) => {
  const formData = new FormData()
  formData.append('audio_file', audioBlob)
  formData.append('language', 'ja-JP')

  const response = await fetch('/api/v1/ai/transcribe', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  })

  const result = await response.json()

  // 非同期処理の場合、ジョブ完了まで待つ
  if (result.job_name) {
    return await pollTranscribeResult(result.job_name)
  }

  return result.text
}

// 音声合成API
const textToSpeech = async (params: {
  text: string
  voice_id: string
}) => {
  const response = await fetch('/api/v1/ai/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(params)
  })

  const result = await response.json()
  return result.audio_url
}
```

### 5. AR アバター口パク同期

```typescript
const playAudioWithLipSync = async (
  audioUrl: string,
  arAvatar: THREE.Object3D
) => {
  const audio = new Audio(audioUrl)

  // Web Audio API で音声解析
  const audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaElementSource(audio)

  source.connect(analyser)
  analyser.connect(audioContext.destination)

  // 音声再生
  audio.play()

  // 口パクアニメーション
  const animate = () => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(dataArray)

    // 音量に応じて口の開閉を制御
    const volume = dataArray.reduce((a, b) => a + b) / dataArray.length
    updateMouthAnimation(arAvatar, volume)

    if (!audio.paused) {
      requestAnimationFrame(animate)
    }
  }

  animate()
}
```

## UI コンポーネント

### ArVoiceChatPanel

```typescript
interface ArVoiceChatPanelProps {
  matchId: number
  conversationId: number
  partnerProfile: Profile
}

const ArVoiceChatPanel: React.FC<ArVoiceChatPanelProps> = ({
  matchId,
  conversationId,
  partnerProfile,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  return (
    <div className="ar-voice-chat">
      {/* AR表示エリア */}
      <ARScene avatar={partnerProfile.ar_avatar} />

      {/* 音声入力ボタン（テキスト入力なし） */}
      <VoiceInputButton
        isRecording={isRecording}
        isProcessing={isProcessing}
        onStart={() => startRecording()}
        onStop={() => stopRecording()}
      />

      {/* 音声波形表示 */}
      <AudioWaveform isActive={isRecording} />

      {/* 状態表示 */}
      <StatusIndicator
        isRecording={isRecording}
        isProcessing={isProcessing}
      />
    </div>
  )
}
```

## 重要な実装ポイント

### 1. テキスト入力を完全に無効化

- AR会話モードでは`<textarea>`や`<input>`を表示しない
- 音声入力ボタンのみを提供
- メッセージング機能（別モード）とは明確に分離

### 2. リアルタイム性の確保

- Amazon Transcribe Streaming API の使用を検討
- 音声認識の遅延を最小化
- WebSocketでのストリーミング配信も検討

### 3. エラーハンドリング

- マイクアクセス拒否
- 音声認識失敗
- AI応答生成失敗
- 音声合成失敗

各ステップでエラーが発生した場合のフォールバック処理を実装

### 4. パフォーマンス最適化

- 音声ファイルの圧縮
- ARアバターのLOD（Level of Detail）
- 不要なリソースの解放

## テスト項目

- [ ] マイク録音機能
- [ ] 音声認識精度
- [ ] AI応答の自然さ（相手のプロフィール反映）
- [ ] 音声合成の品質
- [ ] 口パク同期の正確性
- [ ] エラーハンドリング
- [ ] リアルタイム性（レイテンシ）
