exports.up = (pgm) => {
  pgm.createTable("users", {
    user_id: "id",
    name: {
      type: "varchar(255)",
      notNull: true,
    },
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },
    password_hash: {
      type: "varchar(255)",
      notNull: true,
    },
    role: {
      type: "varchar(20)",
      notNull: true,
    },
    cpf: {
      type: "varchar(11)",
      unique: true,
    },
    cnpj: {
      type: "varchar(14)",
      unique: true,
    },
    address: {
      type: "varchar(255)",
    },
    zip_code: {
      type: "varchar(255)",
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
