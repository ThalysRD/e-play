exports.up = (pgm) => {
    pgm.createTable("carts", {
        id: {
            type: "uuid",
            primaryKey: true,
            default: pgm.func("gen_random_uuid()"),
        },
        user_id: {
            type: "uuid",
            unique: true,
        },
        created_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("now()"),
        },
        updated_at: {
            type: "timestamptz",
            notNull: true,
            default: pgm.func("now()"),
        },
    });
};

exports.down = (pgm) => {
    pgm.dropTable("carts");
};