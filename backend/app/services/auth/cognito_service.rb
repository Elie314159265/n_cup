module Auth
  class CognitoService
    def initialize
      @client = Aws::CognitoIdentityProvider::Client.new(region: ENV["AWS_REGION"] || "ap-northeast-1")
      @user_pool_id = ENV["COGNITO_USER_POOL_ID"]
      @client_id = ENV["COGNITO_CLIENT_ID"]
    end

    def sign_up(email:, password:, username:)
      response = @client.sign_up({
        client_id: @client_id,
        username: email,
        password: password,
        user_attributes: [
          { name: "email", value: email },
          { name: "preferred_username", value: username }
        ]
      })

      {
        user_sub: response.user_sub,
        user_confirmed: response.user_confirmed
      }
    end

    def sign_in(email:, password:)
      response = @client.initiate_auth({
        auth_flow: "USER_PASSWORD_AUTH",
        client_id: @client_id,
        auth_parameters: {
          "USERNAME" => email,
          "PASSWORD" => password
        }
      })

      {
        id_token: response.authentication_result.id_token,
        access_token: response.authentication_result.access_token,
        refresh_token: response.authentication_result.refresh_token,
        expires_in: response.authentication_result.expires_in
      }
    end

    def refresh_token(refresh_token)
      response = @client.initiate_auth({
        auth_flow: "REFRESH_TOKEN_AUTH",
        client_id: @client_id,
        auth_parameters: {
          "REFRESH_TOKEN" => refresh_token
        }
      })

      {
        id_token: response.authentication_result.id_token,
        access_token: response.authentication_result.access_token,
        expires_in: response.authentication_result.expires_in
      }
    end

    def verify_token(token)
      # JWT verification logic with Cognito public keys
      # This is a simplified version - production should verify signature
      decoded_token = JWT.decode(token, nil, false)
      decoded_token.first
    rescue JWT::DecodeError
      nil
    end
  end
end
