# Development seed data
# Run: rails db:seed
#
# 作成されるテストデータ:
#   user_a (ログインして使うユーザー): seed-a@example.com / SeedPass123!
#   user_b (マッチング相手 / AIアバター用): seed-b@example.com / SeedPass123!
#   → 両者間に Match + Conversation が作成される
#
# AR会話テスト手順:
#   1. seed-a@example.com でログイン
#   2. 表示される conversation_id を使って /ar-session?conversation_id=<id> にアクセス

puts "=== LinkPersona シードデータ作成 ==="

SEED_USERS = [
  {
    email: "seed-a@example.com",
    password: "SeedPass123!",
    username: "seed_user_a",
    profile: {
      display_name: "あかり",
      age: 25,
      gender: "female",
      bio: "音楽と旅行が大好きです。カフェめぐりもよくします！",
      location: "東京",
      personality: "cheerful",
      interests: %w[music travel food]
    }
  },
  {
    email: "seed-b@example.com",
    password: "SeedPass123!",
    username: "seed_user_b",
    profile: {
      display_name: "さくら",
      age: 23,
      gender: "female",
      bio: "ゲームと読書が好き。のんびりした性格です。",
      location: "大阪",
      personality: "calm",
      interests: %w[gaming reading food]
    }
  }
].freeze

cognito_service = Auth::CognitoService.new
created_users = []

SEED_USERS.each do |data|
  user = User.find_by(email: data[:email])

  if user
    puts "  SKIP: #{data[:email]} (already exists, id=#{user.id})"
    created_users << user
    next
  end

  begin
    result = cognito_service.sign_up(
      email: data[:email],
      password: data[:password],
      username: data[:username]
    )
    cognito_service.admin_confirm_sign_up(data[:email])

    user = User.create!(
      cognito_sub: result[:user_sub],
      email: data[:email],
      username: data[:username]
    )
    user.create_profile!(data[:profile])

    puts "  OK: #{data[:email]} (id=#{user.id})"
    created_users << user
  rescue => e
    puts "  ERROR: #{data[:email]} - #{e.message}"
  end
end

user_a, user_b = created_users
unless user_a && user_b
  puts "ユーザー作成に失敗したためシードを中断します"
  exit 1
end

# Match 作成（user_id_1 < user_id_2 の制約に合わせる）
id1, id2 = [ user_a.id, user_b.id ].minmax
match = Match.find_or_initialize_by(user_id_1: id1, user_id_2: id2)
if match.new_record?
  match.assign_attributes(status: "matched", matched_at: Time.current, compatibility_score: 85)
  match.save!
  puts "  OK: Match 作成 (id=#{match.id})"
else
  puts "  SKIP: Match already exists (id=#{match.id})"
end

# Conversation 作成
conversation = Conversation.find_or_initialize_by(match: match)
if conversation.new_record?
  conversation.assign_attributes(status: "active", started_at: Time.current)
  conversation.save!
  puts "  OK: Conversation 作成 (id=#{conversation.id})"
else
  puts "  SKIP: Conversation already exists (id=#{conversation.id})"
end

puts ""
puts "=== テスト用ログイン情報 ==="
puts "  Email   : seed-a@example.com"
puts "  Password: SeedPass123!"
puts ""
puts "=== AR会話テスト URL ==="
puts "  /ar-session?conversation_id=#{conversation.id}"
puts ""
puts "完了！"
