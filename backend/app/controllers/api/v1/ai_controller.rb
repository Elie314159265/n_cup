module Api
  module V1
    class AiController < ApplicationController
      before_action :authenticate_user!

      # POST /api/v1/ai/chat
      # AI会話リクエスト（相手のプロフィール情報を基にAIが応答）
      def chat
        ar_session_id = params[:ar_session_id]
        message = params[:message]
        partner_user_id = params.dig(:context, :partner_user_id)

        # ARセッションから相手を特定
        ar_session = ArSession.find_by(session_token: ar_session_id)
        unless ar_session
          return render json: { error: 'AR session not found' }, status: :not_found
        end

        # 相手のプロフィール情報を取得
        conversation = ar_session.conversation
        match = conversation.match
        partner = get_partner_from_match(match, current_user)
        partner_profile = partner.profile

        # AI会話履歴を取得
        conversation_history = ar_session.ai_conversation_history || []

        # Bedrock Service で会話生成
        bedrock_service = Ai::BedrockService.new
        response = bedrock_service.chat(message, {
          partner_profile: partner_profile,
          conversation_history: conversation_history
        })

        # 会話履歴を保存
        new_history = conversation_history + [
          { role: 'user', content: message },
          { role: 'assistant', content: response[:text] }
        ]
        ar_session.update(ai_conversation_history: new_history)

        # メッセージをDBに保存
        Message.create!(
          conversation: conversation,
          sender: current_user,
          message_type: 'text',
          content: message
        )

        Message.create!(
          conversation: conversation,
          sender: partner,
          message_type: 'ai_response',
          content: response[:text],
          metadata: { ai_generated: true }
        )

        render json: {
          response: {
            text: response[:text],
            conversation_id: ar_session_id
          }
        }
      rescue => e
        Rails.logger.error("AI chat error: #{e.message}")
        render json: { error: 'AI chat failed' }, status: :internal_server_error
      end

      # POST /api/v1/ai/speech
      # テキスト→音声変換
      def speech
        text = params[:text]
        voice_id = params[:voice_id] || 'Mizuki'
        engine = params[:engine] || 'neural'

        polly_service = Ai::PollyService.new
        result = polly_service.synthesize_speech(text, voice_id: voice_id, engine: engine)

        if result[:audio_url]
          render json: {
            audio_url: result[:audio_url],
            duration: result[:duration]
          }
        else
          render json: { error: result[:error] }, status: :internal_server_error
        end
      end

      # POST /api/v1/ai/transcribe
      # 音声→テキスト変換
      def transcribe
        audio_file = params[:audio_file]
        language = params[:language] || 'ja-JP'

        unless audio_file
          return render json: { error: 'Audio file is required' }, status: :bad_request
        end

        transcribe_service = Ai::TranscribeService.new
        result = transcribe_service.transcribe_audio(audio_file, language: language)

        render json: result
      end

      # GET /api/v1/ai/transcribe/:job_name
      # 音声認識結果取得（非同期処理の場合）
      def transcribe_result
        job_name = params[:job_name]

        transcribe_service = Ai::TranscribeService.new
        result = transcribe_service.get_transcription_result(job_name)

        render json: result
      end

      private

      def authenticate_user!
        # JWT token authentication
        token = request.headers['Authorization']&.split(' ')&.last
        @current_user = Auth::TokenService.extract_user_from_token(token)

        unless @current_user
          render json: { error: 'Unauthorized' }, status: :unauthorized
        end
      end

      def current_user
        @current_user
      end

      # マッチから相手のユーザーを取得
      def get_partner_from_match(match, current_user)
        if match.user_1 == current_user
          match.user_2
        else
          match.user_1
        end
      end
    end
  end
end
