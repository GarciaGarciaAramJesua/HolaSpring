package escom.ipn.hola_spring_6IV3.dtos;

import java.time.LocalDateTime;

public class FavoriteBookDetailsDto {
    private Long id;
    private String bookId;
    private String bookTitle;
    private String bookCoverId;
    private LocalDateTime addedDate;
    private String authors;
    
    // Constructor por defecto
    public FavoriteBookDetailsDto() {}
    
    // Constructor con parámetros
    public FavoriteBookDetailsDto(Long id, String bookId, String bookTitle, String bookCoverId, LocalDateTime addedDate, String authors) {
        this.id = id;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookCoverId = bookCoverId;
        this.addedDate = addedDate;
        this.authors = authors;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getBookId() {
        return bookId;
    }
    
    public void setBookId(String bookId) {
        this.bookId = bookId;
    }
    
    public String getBookTitle() {
        return bookTitle;
    }
    
    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }
    
    public String getBookCoverId() {
        return bookCoverId;
    }
    
    public void setBookCoverId(String bookCoverId) {
        this.bookCoverId = bookCoverId;
    }
    
    public LocalDateTime getAddedDate() {
        return addedDate;
    }
    
    public void setAddedDate(LocalDateTime addedDate) {
        this.addedDate = addedDate;
    }

    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }
}
