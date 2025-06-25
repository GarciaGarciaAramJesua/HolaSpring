package escom.ipn.hola_spring_6IV3.dtos;

public class FavoriteRequest {
    private String bookId;
    private String bookTitle;
    private String bookCoverId;
    private String authors;
    
    // Constructor por defecto
    public FavoriteRequest() {}
    
    // Constructor con parámetros
    public FavoriteRequest(String bookId, String bookTitle, String bookCoverId, String authors) {
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookCoverId = bookCoverId;
        this.authors = authors;
    }
    
    // Getters y Setters
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

    // Añadir getter y setter
    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }
}
