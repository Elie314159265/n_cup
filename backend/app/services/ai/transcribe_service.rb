module Ai
  class TranscribeService
    def initialize
      @client = Aws::TranscribeService::Client.new(region: ENV['AWS_REGION'] || 'us-east-1')
      @s3_service = Storage::S3Service.new
    end

    def transcribe_audio(audio_file, language: 'ja-JP')
      # 音声ファイルをS3にアップロード
      audio_key = "transcribe-input/#{SecureRandom.uuid}.wav"
      @s3_service.upload(audio_key, audio_file.read)

      # Transcribe ジョブ作成
      job_name = "transcribe-#{SecureRandom.uuid}"
      @client.start_transcription_job({
        transcription_job_name: job_name,
        language_code: language,
        media_format: 'wav',
        media: {
          media_file_uri: @s3_service.s3_uri(audio_key)
        }
      })

      # ジョブIDを返す（結果は非同期で取得）
      { job_name: job_name, status: 'IN_PROGRESS' }
    rescue Aws::TranscribeService::Errors::ServiceError => e
      Rails.logger.error("Transcribe error: #{e.message}")
      { job_name: nil, error: e.message }
    end

    def get_transcription_result(job_name)
      response = @client.get_transcription_job({
        transcription_job_name: job_name
      })

      job = response.transcription_job
      status = job.transcription_job_status

      if status == 'COMPLETED'
        transcript_uri = job.transcript.transcript_file_uri
        transcript_data = fetch_transcript(transcript_uri)
        {
          status: 'COMPLETED',
          text: extract_text(transcript_data),
          confidence: extract_confidence(transcript_data)
        }
      elsif status == 'FAILED'
        { status: 'FAILED', error: job.failure_reason }
      else
        { status: status }
      end
    rescue Aws::TranscribeService::Errors::ServiceError => e
      Rails.logger.error("Get transcription result error: #{e.message}")
      { status: 'ERROR', error: e.message }
    end

    private

    def fetch_transcript(uri)
      require 'net/http'
      response = Net::HTTP.get(URI(uri))
      JSON.parse(response)
    end

    def extract_text(data)
      data.dig('results', 'transcripts', 0, 'transcript')
    end

    def extract_confidence(data)
      items = data.dig('results', 'items') || []
      return 0 if items.empty?

      confidences = items.map { |item| item['alternatives']&.first&.dig('confidence')&.to_f || 0 }
      (confidences.sum / confidences.size).round(2)
    end
  end
end
