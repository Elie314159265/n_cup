module Storage
  class S3Service
    def initialize
      @client = Aws::S3::Client.new(region: ENV['AWS_REGION'] || 'ap-northeast-1')
      @bucket = ENV['S3_BUCKET_NAME'] || 'link_persona-user-assets-production'
      @cloudfront_domain = ENV['CLOUDFRONT_DOMAIN']
    end

    def upload(key, file_data, content_type: 'application/octet-stream')
      @client.put_object({
        bucket: @bucket,
        key: key,
        body: file_data,
        content_type: content_type,
        acl: 'public-read'
      })

      public_url(key)
    rescue Aws::S3::Errors::ServiceError => e
      Rails.logger.error("S3 upload error: #{e.message}")
      nil
    end

    def public_url(key)
      if @cloudfront_domain
        "https://#{@cloudfront_domain}/#{key}"
      else
        "https://#{@bucket}.s3.#{ENV['AWS_REGION'] || 'ap-northeast-1'}.amazonaws.com/#{key}"
      end
    end

    def s3_uri(key)
      "s3://#{@bucket}/#{key}"
    end

    def delete(key)
      @client.delete_object({
        bucket: @bucket,
        key: key
      })
    rescue Aws::S3::Errors::ServiceError => e
      Rails.logger.error("S3 delete error: #{e.message}")
      false
    end
  end
end
