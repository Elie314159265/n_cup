require 'rails_helper'

RSpec.describe 'Api::V1::Conversations', type: :request do
  let(:user)       { create(:user) }
  let(:other_user) { create(:user) }
  let!(:match) do
    u1, u2 = [user, other_user].sort_by(&:id)
    create(:match, user_1: u1, user_2: u2)
  end
  let!(:conversation) { create(:conversation, match: match) }

  describe 'GET /api/v1/conversations' do
    it '200と自分の会話一覧を返す' do
      get '/api/v1/conversations', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['conversations'].length).to eq(1)
      expect(body['conversations'].first['partner']['id']).to eq(other_user.id)
    end
  end

  describe 'POST /api/v1/conversations' do
    let!(:new_match) do
      u1, u2 = [user, create(:user)].sort_by(&:id)
      create(:match, user_1: u1, user_2: u2)
    end

    it '201と新しい会話を返す' do
      post '/api/v1/conversations',
           params: { match_id: new_match.id },
           headers: auth_headers(user)
      expect(response).to have_http_status(:created)
      body = JSON.parse(response.body)
      expect(body['conversation']['status']).to eq('active')
    end

    it '存在しないマッチで404' do
      post '/api/v1/conversations', params: { match_id: 0 }, headers: auth_headers(user)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe 'GET /api/v1/conversations/:id' do
    it '200と会話詳細を返す' do
      get "/api/v1/conversations/#{conversation.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['conversation']['id']).to eq(conversation.id)
      expect(body['conversation']).to have_key('messages')
    end
  end

  describe 'POST /api/v1/conversations/:id/end' do
    it '200を返しステータスをendedに更新する' do
      post "/api/v1/conversations/#{conversation.id}/end", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(conversation.reload.status).to eq('ended')
      expect(conversation.reload.ended_at).to be_present
    end

    it '既にendedの会話は422' do
      conversation.update!(status: 'ended', ended_at: Time.current)
      post "/api/v1/conversations/#{conversation.id}/end", headers: auth_headers(user)
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
