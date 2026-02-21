class CreateArSessions < ActiveRecord::Migration[8.1]
  def change
    create_table :ar_sessions do |t|
      t.references :conversation, null: false, foreign_key: true, index: true
      t.string :session_token, null: false, limit: 255, index: { unique: true }
      t.string :environment_type, null: false, limit: 50
      t.json :environment_data
      t.json :ai_conversation_history

      t.timestamps
    end
  end
end
