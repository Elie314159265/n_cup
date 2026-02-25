module AuthHelpers
  def auth_headers(user)
    token = "test_token_#{user.id}"
    allow(Auth::TokenService).to receive(:extract_user_from_token).with(token).and_return(user)
    { 'Authorization' => "Bearer #{token}" }
  end
end
