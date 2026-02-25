module Auth
  class TokenService
    def self.decode(token)
      cognito_service = CognitoService.new
      cognito_service.verify_token(token)
    end

    def self.extract_user_from_token(token)
      payload = decode(token)
      return nil unless payload

      cognito_sub = payload["sub"]
      User.find_by(cognito_sub: cognito_sub)
    end
  end
end
