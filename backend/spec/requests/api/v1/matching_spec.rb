require 'rails_helper'

RSpec.describe 'Api::V1::Matching', type: :request do
  let(:user)    { create(:user) }
  let!(:profile) { create(:profile, user: user, age: 25, gender: 'male') }

  describe 'GET /api/v1/discover' do
    context 'プロフィール未設定' do
      let(:user_no_profile) { create(:user) }

      it '422を返す' do
        get '/api/v1/discover', headers: auth_headers(user_no_profile)
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context '候補者なし' do
      it '200と空配列を返す' do
        get '/api/v1/discover', headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['candidates']).to eq([])
      end
    end

    context '候補者あり' do
      let!(:candidate1) { create(:user) }
      let!(:candidate2) { create(:user) }
      let!(:_profile1)  { create(:profile, user: candidate1, age: 24, gender: 'female') }
      let!(:_profile2)  { create(:profile, user: candidate2, age: 27, gender: 'female') }

      it '200と候補者リストを返す' do
        get '/api/v1/discover', headers: auth_headers(user)
        expect(response).to have_http_status(:ok)
        body = JSON.parse(response.body)
        expect(body['candidates'].length).to be >= 1
        expect(body['candidates'].first.keys).to include('user_id', 'compatibility_score', 'profile')
      end

      it 'いいね済みユーザーを除外する' do
        create(:like, from_user: user, to_user: candidate1)
        get '/api/v1/discover', headers: auth_headers(user)
        body = JSON.parse(response.body)
        user_ids = body['candidates'].map { |c| c['user_id'] }
        expect(user_ids).not_to include(candidate1.id)
      end
    end
  end
end
