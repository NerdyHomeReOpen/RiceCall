use std::collections::HashMap;
use axum::extract::State;

use crate::utils::standaruduzed_error::StandardizedError;

use super::database_utils::validate_data;
use super::models::accounts::Accounts;

pub fn set_accout(account: String, data: Accounts) -> Result<(), StandardizedError> {
    let mut set_data = HashMap::new();
    set_data.insert("account".to_string(), account);
    set_data.insert("password".to_string(), data.password);
    set_data.insert("user_id".to_string(), data.user_id.to_string());

    let allowed_fields = vec!["password", "user_id"];
    let (valid_fields, invalid_fields) = validate_data(set_data, &allowed_fields)?;

    if !invalid_fields.is_empty() {
        return Err(StandardizedError::new(
            &format!("Invalid fields: {:?}", invalid_fields),
            "set_account",
            "database",
            "set",
            400,
            "Bad Request",
        ));
    }

    // Proceed with the database operation using valid_fields
    Ok(())
}

pub fn get_accout(accout: String) -> Result<(), StandardizedError> {
    let mut get_data = HashMap::new();
    get_data.insert("account".to_string(), accout);

    let allowed_fields = vec!["account"];
    let (valid_fields, invalid_fields) = validate_data(get_data, &allowed_fields)?;

    if !invalid_fields.is_empty() {
        return Err(StandardizedError::new(
            &format!("Invalid fields: {:?}", invalid_fields),
            "get_account",
            "database",
            "get",
            400,
            "Bad Request",
        ));
    }

    // Proceed with the database operation using valid_fields
    Ok(())
}

pub fn delete_account(account: String) -> Result<(), StandardizedError> {
    let mut delete_data = HashMap::new();
    delete_data.insert("account".to_string(), account);

    let allowed_fields = vec!["account"];
    let (valid_fields, invalid_fields) = validate_data(delete_data, &allowed_fields)?;

    if !invalid_fields.is_empty() {
        return Err(StandardizedError::new(
            &format!("Invalid fields: {:?}", invalid_fields),
            "delete_account",
            "database",
            "delete",
            400,
            "Bad Request",
        ));
    }

    // Proceed with the database operation using valid_fields
    Ok(())
}

pub fn update_account(account: String, data: Accounts) -> Result<(), StandardizedError> {
    let mut update_data = HashMap::new();
    update_data.insert("account".to_string(), account);
    update_data.insert("password".to_string(), data.password);
    update_data.insert("user_id".to_string(), data.user_id.to_string());

    let allowed_fields = vec!["password", "user_id"];
    let (valid_fields, invalid_fields) = validate_data(update_data, &allowed_fields)?;

    if !invalid_fields.is_empty() {
        return Err(StandardizedError::new(
            &format!("Invalid fields: {:?}", invalid_fields),
            "update_account",
            "database",
            "update",
            400,
            "Bad Request",
        ));
    }

    // Proceed with the database operation using valid_fields
    Ok(())
}