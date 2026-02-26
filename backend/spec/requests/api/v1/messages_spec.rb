require 'rails_helper'

RSpec.describe 'Api::V1::Messages', type: :request do
  let(:user)         { create(:user) }
  let(:other_user)   { create(:user) }
  let!(:match) do
    u1, u2 = [ user, other_user ].sort_by(&:id)
    create(:match, user_1: u1, user_2: u2)
  end
  let!(:conversation) { create(:conversation, match: match) }
  let!(:message)      { create(:message, conversation: conversation, sender: other_user) }

  describe 'GET /api/v1/conversations/:conversation_id/messages' do
    it '200とメッセージ一覧を返す' do
      get "/api/v1/conversations/#{conversation.id}/messages",
          headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['messages'].length).to eq(1)
      expect(body['messages'].first['content']).to eq(message.content)
    end
  end

  describe 'POST /api/v1/conversations/:conversation_id/messages' do
    before do
      allow(ActionCable.server).to receive(:broadcast)
    end

    it '201とメッセージを返しAction Cableで配信する' do
      post "/api/v1/conversations/#{conversation.id}/messages",
           params: { content: 'こんにちは', message_type: 'text' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['message']['content']).to eq('こんにちは')
      expect(body['message']['sender_id']).to eq(user.id)
      expect(ActionCable.server).to have_received(:broadcast)
        .with("conversation_#{conversation.id}", hash_including(type: 'new_message'))
    end

    it 'ended会話へのメッセージは422' do
      conversation.update!(status: 'ended', ended_at: Time.current)
      post "/api/v1/conversations/#{conversation.id}/messages",
           params: { content: 'test' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'PATCH /api/v1/messages/:id/read' do
    it '200を返しread_atを設定する' do
      patch "/api/v1/messages/#{message.id}/read", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(message.reload.read_at).to be_present
    end

    it '自分が関与しない会話のメッセージは403' do
      unrelated = create(:message, conversation: create(:conversation, match: create(:match,
                           user_1: create(:user), user_2: create(:user))),
                         sender: create(:user))
      patch "/api/v1/messages/#{unrelated.id}/read", headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
