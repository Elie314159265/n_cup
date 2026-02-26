module Ai
  class PollyService
    def initialize
      @client = Aws::Polly::Client.new(region: ENV["AWS_REGION"] || "ap-northeast-1")
      @s3_service = Storage::S3Service.new
    end

    # neural engineに対応している日本語ボイス
    NEURAL_SUPPORTED_VOICES = %w[Takumi].freeze

    def synthesize_speech(text, voice_id: "Mizuki", engine: "neural")
      # Mizukiはstandardのみ対応。Takumiはneural対応
      actual_engine = NEURAL_SUPPORTED_VOICES.include?(voice_id) ? engine : "standard"

      response = @client.synthesize_speech({
        text: text,
        voice_id: voice_id,
        output_format: "mp3",
        engine: actual_engine,
        language_code: "ja-JP"
      })

      # S3にアップロード
      audio_key = "audio/#{SecureRandom.uuid}.mp3"
      @s3_service.upload(audio_key, response.audio_stream.read)

      {
        audio_url: @s3_service.public_url(audio_key),
        duration: estimate_duration(text)
      }
    rescue Aws::Polly::Errors::ServiceError => e
      Rails.logger.error("Polly synthesis error: #{e.message}")
      { audio_url: nil, error: e.message }
    end

    private

    def estimate_duration(text)
      # 日本語の平均読み上げ速度: 約400文字/分
      (text.length / 400.0 * 60).round(1)
    end
  end
end
