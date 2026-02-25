module Ai
  class BedrockService
    def initialize
      @client = Aws::BedrockRuntime::Client.new(region: ENV["AWS_REGION"] || "ap-northeast-1")
      @model_id = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    end

    # Chat with AI that impersonates a matched partner
    # context should include partner_profile (Profile model)
    def chat(message, context = {})
      response = @client.invoke_model({
        model_id: @model_id,
        content_type: "application/json",
        accept: "application/json",
        body: build_request_body(message, context).to_json
      })

      parse_response(response.body.read)
    end

    private

    def build_request_body(message, context)
      partner_profile = context[:partner_profile]
      conversation_history = context[:conversation_history] || []

      system_prompt = build_system_prompt(partner_profile)
      messages = conversation_history + [
        {
          role: "user",
          content: message
        }
      ]

      {
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1024,
        system: system_prompt,
        messages: messages
      }
    end

    def build_system_prompt(partner_profile)
      return default_prompt unless partner_profile

      name = partner_profile.display_name || "ユーザー"
      age = partner_profile.age
      gender = partner_profile.gender
      personality = partner_profile.personality || "親しみやすい"
      interests = partner_profile.interests || []
      interests_text = interests.any? ? interests.join("、") : "様々なこと"
      bio = partner_profile.bio || ""

      """
      あなたは「#{name}」という人物になりきってください。

      プロフィール:
      - 名前: #{name}
      - 年齢: #{age}歳
      - 性別: #{gender}
      - 性格: #{personality}
      - 趣味・興味: #{interests_text}
      - 自己紹介: #{bio}

      重要な指示:
      1. この人物として自然に会話してください
      2. プロフィール情報に基づいた話題や反応をしてください
      3. この人物の性格や年齢に合った言葉遣いをしてください
      4. 相手の話をよく聞き、興味を持って質問してください
      5. 自然で親しみやすい会話を心がけてください
      """
    end

    def default_prompt
      """
      あなたは親しみやすい性格のARアバターです。
      自然で親しみやすい会話を心がけてください。
      相手の話をよく聞き、質問に答えながら、相手について知ろうとしてください。
      """
    end

    def parse_response(body)
      data = JSON.parse(body)
      {
        text: data.dig("content", 0, "text"),
        stop_reason: data["stop_reason"],
        usage: data["usage"]
      }
    rescue JSON::ParserError => e
      Rails.logger.error("Bedrock response parse error: #{e.message}")
      { text: nil, error: e.message }
    end
  end
end
