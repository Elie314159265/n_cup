require 'rails_helper'

RSpec.describe 'Api::V1::Ai', type: :request do
  let(:user)       { create(:user) }
  let(:other_user) { create(:user) }
  let!(:match) do
    u1, u2 = [ user, other_user ].sort_by(&:id)
    create(:match, user_1: u1, user_2: u2)
  end
  let!(:conversation) { create(:conversation, match: match) }
  let!(:ar_session)   { create(:ar_session, conversation: conversation) }

  describe 'POST /api/v1/ai/chat' do
    let(:bedrock_double) { instance_double(Ai::BedrockService) }

    before do
      allow(Ai::BedrockService).to receive(:new).and_return(bedrock_double)
      allow(bedrock_double).to receive(:chat).and_return({ text: 'こんにちは！' })
    end

    it '200とAI応答テキストを返す' do
      post '/api/v1/ai/chat',
           params: { ar_session_id: ar_session.session_token, message: 'やあ' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['response']['text']).to eq('こんにちは！')
    end

    it '存在しないar_session_idは404' do
      post '/api/v1/ai/chat',
           params: { ar_session_id: 'invalid_token', message: 'test' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'POST /api/v1/ai/speech' do
    let(:polly_double) { instance_double(Ai::PollyService) }

    before do
      allow(Ai::PollyService).to receive(:new).and_return(polly_double)
    end

    it '200と音声URLを返す' do
      allow(polly_double).to receive(:synthesize_speech)
        .and_return({ audio_url: 'https://example.com/audio.mp3' })

      post '/api/v1/ai/speech',
           params: { text: 'こんにちは', voice_id: 'Mizuki', engine: 'neural' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['audio_url']).to be_present
    end

    it 'Polly失敗時は500を返す' do
      allow(polly_double).to receive(:synthesize_speech)
        .and_return({ error: 'Polly error' })

      post '/api/v1/ai/speech',
           params: { text: 'こんにちは' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:internal_server_error)
    end
  end
end
