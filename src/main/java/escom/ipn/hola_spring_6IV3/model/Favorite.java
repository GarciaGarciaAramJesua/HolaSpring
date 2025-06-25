package escom.ipn.hola_spring_6IV3.model;

import jakarta.persistence.*;

@Entity
@Table(name = "favorites", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "book_id"})
})
public class Favorite{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "book_id", nullable = false, length = 40)
    private String bookId; // ID de OpenLibrary o tu identificador de libro

    @Column(name = "book_title")
    private String bookTitle;

    @Column(name = "book_cover_id")
    private String bookCoverId; // ID de la portada para mostrar imagen
    
    @Column(name = "added_date")
    private java.time.LocalDateTime addedDate;

    @Column(name = "authors")
    private String authors; // Lista de autores como String, puedes cambiarlo a una lista si lo prefieres

    // Constructor por defecto
    public Favorite() {
        this.addedDate = java.time.LocalDateTime.now();
    }
    
    // Constructor con parámetros
    public Favorite(User user, String bookId, String bookTitle, String bookCoverId, String authors) {
        this.user = user;
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.bookCoverId = bookCoverId;
        this.addedDate = java.time.LocalDateTime.now();
        this.authors = authors;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
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
    
    public java.time.LocalDateTime getAddedDate() {
        return addedDate;
    }
    
    public void setAddedDate(java.time.LocalDateTime addedDate) {
        this.addedDate = addedDate;
    }

    public String getAuthors() {
        return authors;
    }

    public void setAuthors(String authors) {
        this.authors = authors;
    }
}
