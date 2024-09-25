# Steps
1. Make models in `mra-db-schemas` project
2. Copy models to this folder
3. Add `primaryKey: true` to `token` column in `MraTokenBlacklist` model.

```json
token: {
        type: DataTypes.STRING(1023),
        allowNull: false,
        primaryKey: true
},
```