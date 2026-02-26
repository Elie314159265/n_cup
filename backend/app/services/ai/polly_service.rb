module Ai
  class PollyService
    # neural engineに対応している日本語ボイス
    NEURAL_SUPPORTED_VOICES = %w[Takumi].freeze

    def initialize
      @client = Aws::Polly::Client.new(region: ENV["AWS_REGION"] || "ap-northeast-1")
      @s3_service = Storage::S3Service.new
    end

    def synthesize_speech(text, voice_id: "Mizuki", engine: "neural")
      # Mizukiはstandardのみ対応。Takumiはneural対応
      actual_engine = NEURAL_SUPPORTED_VOICES.include?(voice_id) ? engine : "standard"

      audio_result  = nil
      visemes_result = []
      audio_error   = nil

      # 音声とVisemeを並列生成してレイテンシを削減
      audio_thread = Thread.new do
        audio_result = call_polly_audio(text, voice_id, actual_engine)
      rescue => e
        audio_error = e.message
      end

      visemes_thread = Thread.new do
        visemes_result = call_polly_visemes(text, voice_id, actual_engine)
      rescue => e
        Rails.logger.warn("Polly viseme generation failed: #{e.message}")
        visemes_result = []
      end

      audio_thread.join
      visemes_thread.join

      if audio_error
        Rails.logger.error("Polly synthesis error: #{audio_error}")
        return { audio_url: nil, error: audio_error }
      end

      {
        audio_url: audio_result[:audio_url],
        duration: estimate_duration(text),
        visemes: visemes_result
      }
    rescue Aws::Polly::Errors::ServiceError => e
      Rails.logger.error("Polly synthesis error: #{e.message}")
      { audio_url: nil, error: e.message }
    end

    private

    def call_polly_audio(text, voice_id, engine)
      response = @client.synthesize_speech({
        text: text,
        voice_id: voice_id,
        output_format: "mp3",
        engine: engine,
        language_code: "ja-JP"
      })

      audio_key = "audio/#{SecureRandom.uuid}.mp3"
      @s3_service.upload(audio_key, response.audio_stream.read)

      { audio_url: @s3_service.public_url(audio_key) }
    end

    def call_polly_visemes(text, voice_id, engine)
      response = @client.synthesize_speech({
        text: text,
        voice_id: voice_id,
        output_format: "json",
        speech_mark_types: [ "viseme" ],
        engine: engine,
        language_code: "ja-JP"
      })

      # レスポンスはNDJSON（1行ずつJSONオブジェクト）
      raw = response.audio_stream.read.force_encoding("UTF-8")
      raw.lines.filter_map do |line|
        line = line.strip
        next if line.empty?
        parsed = JSON.parse(line)
        next unless parsed["type"] == "viseme"
        { time: parsed["time"], value: parsed["value"] }
      rescue JSON::ParserError
        nil
      end
    rescue Aws::Polly::Errors::ServiceError => e
      Rails.logger.error("Polly viseme error: #{e.message}")
      []
    end

    def estimate_duration(text)
      # 日本語の平均読み上げ速度: 約400文字/分
      (text.length / 400.0 * 60).round(1)
    end
  end
end
