exports.up = (pgm) => {
  pgm.createTable("users", {
    user_id: "id",
    name: {
      type: "varchar(255)",
      notNull: true,
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
    cpf_cnpj: {
      type: "varchar(20)",
      notNull: true,
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
  });
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
