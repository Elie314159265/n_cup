class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    create_table :conversations do |t|
      t.references :match, null: false, foreign_key: true, index: true
      t.string :ar_session_id, limit: 255
      t.string :status, null: false, limit: 20, default: 'active'
      t.timestamp :started_at
      t.timestamp :ended_at

      t.timestamps
    end

    add_index :conversations, :status
  end
end
