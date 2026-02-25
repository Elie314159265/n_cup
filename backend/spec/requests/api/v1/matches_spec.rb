require 'rails_helper'

RSpec.describe 'Api::V1::Matches', type: :request do
  let(:user)       { create(:user) }
  let(:other_user) { create(:user) }
  let!(:match) do
    u1, u2 = [user, other_user].sort_by(&:id)
    create(:match, user_1: u1, user_2: u2)
  end

  describe 'GET /api/v1/matches' do
    it '200と自分のマッチ一覧を返す' do
      get '/api/v1/matches', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['matches'].length).to eq(1)
      expect(body['matches'].first['partner']['id']).to eq(other_user.id)
    end

    it '他人のマッチは含まれない' do
      third_user  = create(:user)
      fourth_user = create(:user)
      u1, u2 = [third_user, fourth_user].sort_by(&:id)
      create(:match, user_1: u1, user_2: u2)

      get '/api/v1/matches', headers: auth_headers(user)
      body = JSON.parse(response.body)
      expect(body['matches'].length).to eq(1)
    end
  end

  describe 'DELETE /api/v1/matches/:id' do
    it '200を返しステータスをrejectedに更新する' do
      delete "/api/v1/matches/#{match.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      expect(match.reload.status).to eq('rejected')
    end

    it '自分が関与しないマッチは403' do
      other_match = create(:match,
                           user_1: create(:user),
                           user_2: create(:user))
      delete "/api/v1/matches/#{other_match.id}", headers: auth_headers(user)
      expect(response).to have_http_status(:forbidden)
    end
  end
end
