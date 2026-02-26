require 'rails_helper'

RSpec.describe 'Api::V1::ArSessions', type: :request do
  let(:user)         { create(:user) }
  let(:other_user)   { create(:user) }
  let!(:match) do
    u1, u2 = [ user, other_user ].sort_by(&:id)
    create(:match, user_1: u1, user_2: u2)
  end
  let!(:conversation) { create(:conversation, match: match) }

  before { allow(ActionCable.server).to receive(:broadcast) }

  describe 'POST /api/v1/ar_sessions' do
    it '201とARセッションを返す' do
      post '/api/v1/ar_sessions',
           params: { conversation_id: conversation.id, environment_type: 'cafe' },
           headers: auth_headers(user)
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['ar_session']['session_token']).to be_present
      expect(body['ar_session']['environment_type']).to eq('cafe')
    end

    it '同一会話にARセッションが既存の場合は200で既存セッションを返す' do
      existing = create(:ar_session, conversation: conversation)
      post '/api/v1/ar_sessions',
           params: { conversation_id: conversation.id },
           headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['ar_session']['session_token']).to eq(existing.session_token)
    end
  end

  describe 'POST /api/v1/ar_sessions/:id/join' do
    let!(:ar_session) { create(:ar_session, conversation: conversation) }

    it '200を返しAction Cableでjoin通知する' do
      post "/api/v1/ar_sessions/#{ar_session.id}/join", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(ActionCable.server).to have_received(:broadcast)
        .with("conversation_#{conversation.id}", hash_including(type: 'user_joined_ar'))
    end
  end

  describe 'POST /api/v1/ar_sessions/:id/leave' do
    let!(:ar_session) { create(:ar_session, conversation: conversation) }

    it '200を返しAction Cableでleave通知する' do
      post "/api/v1/ar_sessions/#{ar_session.id}/leave", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(ActionCable.server).to have_received(:broadcast)
        .with("conversation_#{conversation.id}", hash_including(type: 'user_left_ar'))
    end
  end
end
