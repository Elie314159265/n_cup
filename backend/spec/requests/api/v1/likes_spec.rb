require 'rails_helper'

RSpec.describe 'Api::V1::Likes', type: :request do
  let(:user)        { create(:user) }
  let(:other_user)  { create(:user) }
  let!(:_profile1)  { create(:profile, user: user) }
  let!(:_profile2)  { create(:profile, user: other_user) }

  describe 'POST /api/v1/likes' do
    context 'マッチが成立しない場合' do
      it '201を返しis_matchがfalse' do
        post '/api/v1/likes',
             params: { to_user_id: other_user.id },
             headers: auth_headers(user)
        expect(response).to have_http_status(:created)
        body = JSON.parse(response.body)
        expect(body['is_match']).to be false
        expect(Like.find_by(from_user: user, to_user: other_user)).to be_present
      end
    end

    context '相互いいねでマッチが成立する場合' do
      before { create(:like, from_user: other_user, to_user: user) }

      it '201を返しis_matchがtrueでmatchを含む' do
        post '/api/v1/likes',
             params: { to_user_id: other_user.id },
             headers: auth_headers(user)
        expect(response).to have_http_status(:created)
        body = JSON.parse(response.body)
        expect(body['is_match']).to be true
        expect(body['match']['id']).to be_present
        expect(Match.where(status: 'matched').count).to eq(1)
      end
    end

    context '重複いいね' do
      before { create(:like, from_user: user, to_user: other_user) }

      it '422を返す' do
        post '/api/v1/likes',
             params: { to_user_id: other_user.id },
             headers: auth_headers(user)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context '存在しないユーザー' do
      it '404を返す' do
        post '/api/v1/likes', params: { to_user_id: 0 }, headers: auth_headers(user)
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'GET /api/v1/likes' do
    before { create(:like, from_user: user, to_user: other_user) }

    it '200と送信済みいいねを返す' do
      get '/api/v1/likes', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['likes'].length).to eq(1)
    end
  end

  describe 'GET /api/v1/likes/received' do
    before { create(:like, from_user: other_user, to_user: user) }

    it '200と受信したいいねを返す' do
      get '/api/v1/likes/received', headers: auth_headers(user)
      expect(response).to have_http_status(:ok)
      body = JSON.parse(response.body)
      expect(body['likes'].length).to eq(1)
      expect(body['likes'].first['user']['id']).to eq(other_user.id)
    end
  end
end
