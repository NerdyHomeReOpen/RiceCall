use std::fmt;

#[derive(Debug)]
pub struct StandardizedError {
    pub error_message: String,
    pub name: String,
    pub part: String,
    pub tag: String,
    pub status_code: u16,
    pub title: String,
}

impl StandardizedError {
    #[allow(dead_code)]
    pub fn new(
        error_message: &str,
        name: &str,
        part: &str,
        tag: &str,
        status_code: u16,
        title: &str,
    ) -> Self {
        Self {
            error_message: error_message.to_string(),
            name: name.to_string(),
            part: part.to_string(),
            tag: tag.to_string(),
            status_code: status_code,
            title: title.to_string(),
        }
    }
}

impl fmt::Display for StandardizedError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "Error: {}\nName: {}\nPart: {}\nTag: {}\nStatus Code: {}\nTitle: {}",
            self.error_message, self.name, self.part, self.tag, self.status_code, self.title
        )
    }
}