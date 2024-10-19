let currentPage = 1;
let dropdownListValue = "";
let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

const API_URL = "https://gutendex.com/books/";
const bookListEl = document.getElementById("bookList");
const searchBarEl = document.getElementById("searchBar");
const pageNumberEl = document.getElementById("pageNumber");
const prevPageEl = document.getElementById("prevPage");
const nextPageEl = document.getElementById("nextPage");

const wishlistBooks = document.getElementById("wishlistBooks");
const count = document.getElementById("count");
const count1 = document.getElementById("count1");
count.innerText = wishlist.length;
if (count1) {
  count1.innerText = wishlist.length;
}
// Show loading skeletons
function showSkeleton(eliment) {
  eliment.innerHTML = ""; // Clear the list before adding skeletons

  for (let i = 0; i < 30; i++) {
    // Show 8 skeleton cards
    const skeletonItem = document.createElement("div");
    skeletonItem.classList.add("book-item", "skeleton-item");

    skeletonItem.innerHTML = `
            <div class="skeleton skeleton-img"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        `;

    eliment.appendChild(skeletonItem);
  }
}

const dropdownButton = document.getElementById("dropdownButton");
const dropdownList = document.getElementById("dropdownList");

// Fetch Genres and populate the custom dropdown
function fetchGenres(data) {
  const genres = new Set();
  data.results.forEach((book) => {
    if (book.subjects) {
      book.subjects.forEach((subject) => genres.add(subject));
    }
  });

  // Clear the existing options in the dropdown
  dropdownList.innerHTML = "";

  // Create default option
  const defaultOption = document.createElement("li");
  defaultOption.textContent = "All Genres";
  defaultOption.dataset.value = "";
  dropdownList.appendChild(defaultOption);

  // Add genres to the dropdown list
  genres.forEach((genre) => {
    const li = document.createElement("li");
    li.textContent = genre;
    li.dataset.value = genre;
    dropdownList.appendChild(li);
  });
}

// Toggle dropdown visibility
dropdownButton.addEventListener("click", () => {
  dropdownList.classList.toggle("hidden");
});

// Handle selection
dropdownList.addEventListener("click", (e) => {
  if (e.target.tagName === "LI") {
    dropdownButton.textContent = e.target.textContent;
    dropdownList.classList.add("hidden");
    dropdownListValue = e.target.dataset.value;
    console.log("Selected Genre:", e.target.dataset.value);
    const searchTerm = searchBarEl.value;
    const url = `${API_URL}?page=${currentPage}&search=${searchTerm}&topic=${e.target.dataset.value}`;
    fetchBooks(bookListEl, url);
  }
});

// Close dropdown if clicked outside
window.addEventListener("click", (e) => {
  if (!dropdownButton.contains(e.target) && !dropdownList.contains(e.target)) {
    dropdownList.classList.add("hidden");
  }
});

// fetch Genres
// function fetchGenres(data) {
//   const genres = new Set();
//   data.results.forEach((book) => {
//     if (book.subjects) {
//       book.subjects.forEach((subject) => genres.add(subject));
//     }
//   });
//   genreFilterEl.innerHTML = '<option value="">Select Genre/Topic</option>';
//   genres.forEach((genre) => {
//     const option = document.createElement("option");
//     option.value = genre;
//     option.textContent = genre;
//     genreFilterEl.appendChild(option);
//   });
// }

// Fetch and display books
async function fetchBooks(eliment, url) {
  showSkeleton(eliment);
  const res = await fetch(url);
  const data = await res.json();
  displayBooks(eliment, data.results);
  fetchGenres(data);
  togglePagination(data.next, data.previous);
}
// displayBooks
function displayBooks(eliment, books) {
  eliment.innerHTML = "";
  books.forEach((book) => {
    const bookItem = document.createElement("div");
    bookItem.className = "book-item";
    const isWishlisted = wishlist.includes(book.id);
    const likeIconClass = isWishlisted ? "like-icon liked" : "like-icon";

    bookItem.innerHTML = `
      <div class="book_content">
      <img src="${book.formats["image/jpeg"]}" alt="${book.title}">
      <h2>${book.title}</h2>
      <p>Author: ${book.authors.map((author) => author.name).join(", ")}</p>
      <p>ID: ${book.id}</p>
      <span class="${likeIconClass}" data-id="${book.id}">&#10084;</span>
      </div>
      <div class="read_more"><button onclick="viewBook(${
        book.id
      })">View Details</button></div>
    `;
    eliment.appendChild(bookItem);
  });
}
// togglePagination
function togglePagination(next, previous) {
  nextPageEl.disabled = !next;
  prevPageEl.disabled = !previous;
}

// handleSearch and filter
function handleSearch() {
  const searchTerm = searchBarEl.value;
  const url = `${API_URL}?page=${currentPage}&search=${searchTerm}&topic=${dropdownListValue}`;
  fetchBooks(bookListEl, url);
}

// handleWishlistToggle
function handleWishlistToggle(event) {
  if (event.target.classList.contains("like-icon")) {
    const bookId = parseInt(event.target.dataset.id);
    if (wishlist.includes(bookId)) {
      wishlist = wishlist.filter((id) => id !== bookId);
    } else {
      wishlist.push(bookId);
    }
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    event.target.classList.toggle("liked");
  }
}

// handlePageChange
function handlePageChange(direction) {
  currentPage += direction;
  const url = `${API_URL}?page=${currentPage}&search=${searchBarEl.value}&topic=${dropdownListValue}`;
  fetchBooks(bookListEl, url);
  pageNumberEl.textContent = `Page ${currentPage}`;
}

searchBarEl.addEventListener("input", handleSearch);
if (bookListEl) {
  bookListEl.addEventListener("click", handleWishlistToggle);
  nextPageEl.addEventListener("click", () => handlePageChange(1));
  prevPageEl.addEventListener("click", () => handlePageChange(-1));
}

if (bookListEl) {
  const url = `${API_URL}?page=${1}`;
  fetchBooks(bookListEl, url);
}

function viewBook(bookId) {
  window.location.href = `book-details.html?id=${bookId}`;
}

if (wishlistBooks) {
  const url = `${API_URL}?ids=${wishlist.join(",")}`;
  if (wishlist.length > 0) {
    fetchBooks(wishlistBooks, url);
  } else {
    wishlistBooks.innerHTML = "<p>Your wishlist is empty.</p>";
  }
}

// Handle page loading
window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const bookId = urlParams.get("id");

  if (bookId) {
    fetchBookDetails(bookId);
  }
};

// Fetch and display book details
async function fetchBookDetails(bookId) {
  const container = document.querySelector(".container");

  const skeletonLoader = createSkeletonLoader();
  container.appendChild(skeletonLoader);
  const response = await fetch(`${API_URL}/${bookId}`);
  const data = await response.json();
  const book = data;
  container.removeChild(skeletonLoader);
  displayBookDetails(book);
}
function displayBookDetails(book) {
  const container = document.querySelector(".container"); // Ensure there is a .container div in your HTML

  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");

  // Create book cover
  const bookCover = document.createElement("div");
  bookCover.classList.add("book-cover");
  const coverImage = document.createElement("img");
  coverImage.src = book.formats["image/jpeg"]; // Assuming there's a JPEG format
  coverImage.alt = `${book.title} Cover`;
  bookCover.appendChild(coverImage);

  // Create book info section
  const bookInfo = document.createElement("div");
  bookInfo.classList.add("book-info");

  // Title
  const title = document.createElement("h1");
  title.classList.add("book-title");
  title.textContent = book.title;
  bookInfo.appendChild(title);

  // Author(s)
  const author = document.createElement("h2");
  author.classList.add("book-author");
  author.textContent = `by ${book.authors
    .map((a) => a.name)
    .join(", ")} (${book.authors
    .map((a) => a.birth_year)
    .join(", ")} - ${book.authors.map((a) => a.death_year).join(", ")})`;
  bookInfo.appendChild(author);

  // Languages
  const languagesDiv = document.createElement("div");
  languagesDiv.classList.add("languages");
  const languagesHeading = document.createElement("h3");
  languagesHeading.textContent = "Languages:";
  languagesDiv.appendChild(languagesHeading);
  const languagesList = document.createElement("ul");
  book.languages.forEach((language) => {
    const li = document.createElement("li");
    li.textContent = language;
    languagesList.appendChild(li);
  });
  languagesDiv.appendChild(languagesList);
  bookInfo.appendChild(languagesDiv);

  // Copyright
  const copyrightDiv = document.createElement("div");
  copyrightDiv.classList.add("copyright");
  copyrightDiv.textContent = `Copyright: ${book.copyright ? "Yes" : "No"}`; // Display copyright status
  bookInfo.appendChild(copyrightDiv);

  // Media Type
  const mediaTypeDiv = document.createElement("div");
  mediaTypeDiv.classList.add("media-type");
  mediaTypeDiv.textContent = `Media Type: ${book.media_type}`;
  bookInfo.appendChild(mediaTypeDiv);

  // Download Count
  const downloadCountDiv = document.createElement("div");
  downloadCountDiv.classList.add("download-count");
  downloadCountDiv.textContent = `Download Count: ${book.download_count}`;
  bookInfo.appendChild(downloadCountDiv);

  // Subjects
  const subjectsDiv = document.createElement("div");
  subjectsDiv.classList.add("book-details");
  const subjectsHeading = document.createElement("h3");
  subjectsHeading.textContent = "Subjects:";
  subjectsDiv.appendChild(subjectsHeading);
  const subjectsList = document.createElement("ul");
  book.subjects.forEach((subject) => {
    const li = document.createElement("li");
    li.textContent = subject;
    subjectsList.appendChild(li);
  });
  subjectsDiv.appendChild(subjectsList);
  bookInfo.appendChild(subjectsDiv);

  // Bookshelves
  const bookshelvesDiv = document.createElement("div");
  bookshelvesDiv.classList.add("bookshelves");
  const bookshelvesHeading = document.createElement("h3");
  bookshelvesHeading.textContent = "Bookshelves:";
  bookshelvesDiv.appendChild(bookshelvesHeading);
  const bookshelvesList = document.createElement("ul");
  book.bookshelves.forEach((shelf) => {
    const li = document.createElement("li");
    li.textContent = shelf;
    bookshelvesList.appendChild(li);
  });
  bookshelvesDiv.appendChild(bookshelvesList);
  bookInfo.appendChild(bookshelvesDiv);

  // Download Formats
  const downloadsDiv = document.createElement("div");
  downloadsDiv.classList.add("downloads");
  const downloadsHeading = document.createElement("h3");
  downloadsHeading.textContent = "Download Formats:";
  downloadsDiv.appendChild(downloadsHeading);
  const downloadsList = document.createElement("ul");
  for (const [format, url] of Object.entries(book.formats)) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.textContent = format.split("/")[1].toUpperCase(); // Display format type (e.g., EPUB, MOBI)
    li.appendChild(link);
    downloadsList.appendChild(li);
  }
  downloadsDiv.appendChild(downloadsList);
  bookInfo.appendChild(downloadsDiv);

  // Append cover and info to the card
  bookCard.appendChild(bookCover);
  bookCard.appendChild(bookInfo);
  container.appendChild(bookCard);
}

function createSkeletonLoader() {
  // Create the book card container
  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card", "skeleton-loader");

  // Create book cover skeleton
  const bookCover = document.createElement("div");
  bookCover.classList.add("book-cover");
  const skeletonCover = document.createElement("div");
  skeletonCover.classList.add("skeleton", "skeleton-cover");
  bookCover.appendChild(skeletonCover);

  // Create book info skeleton
  const bookInfo = document.createElement("div");
  bookInfo.classList.add("book-info");

  const skeletonTitle = document.createElement("h1");
  skeletonTitle.classList.add("skeleton", "skeleton-title");
  bookInfo.appendChild(skeletonTitle);

  const skeletonAuthor = document.createElement("h2");
  skeletonAuthor.classList.add("skeleton", "skeleton-author");
  bookInfo.appendChild(skeletonAuthor);

  // Create subjects skeleton
  const subjectsDiv = document.createElement("div");
  subjectsDiv.classList.add("book-details");
  const subjectsHeading = document.createElement("h3");
  subjectsHeading.textContent = "Subjects:";
  subjectsDiv.appendChild(subjectsHeading);
  const subjectsList = document.createElement("ul");
  subjectsList.classList.add("skeleton-list");
  for (let i = 0; i < 6; i++) {
    // Create 6 placeholder subjects
    const li = document.createElement("li");
    li.classList.add("skeleton", "skeleton-list-item");
    li.textContent = ""; // No text for skeleton
    subjectsList.appendChild(li);
  }
  subjectsDiv.appendChild(subjectsList);
  bookInfo.appendChild(subjectsDiv);

  // Create bookshelves skeleton
  const bookshelvesDiv = document.createElement("div");
  bookshelvesDiv.classList.add("bookshelves");
  const bookshelvesHeading = document.createElement("h3");
  bookshelvesHeading.textContent = "Bookshelves:";
  bookshelvesDiv.appendChild(bookshelvesHeading);
  const bookshelvesList = document.createElement("ul");
  bookshelvesList.classList.add("skeleton-list");
  for (let i = 0; i < 6; i++) {
    // Create 6 placeholder bookshelves
    const li = document.createElement("li");
    li.classList.add("skeleton", "skeleton-list-item");
    li.textContent = ""; // No text for skeleton
    bookshelvesList.appendChild(li);
  }
  bookshelvesDiv.appendChild(bookshelvesList);
  bookInfo.appendChild(bookshelvesDiv);

  // Create downloads skeleton
  const downloadsDiv = document.createElement("div");
  downloadsDiv.classList.add("downloads");
  const downloadsHeading = document.createElement("h3");
  downloadsHeading.textContent = "Download Formats:";
  downloadsDiv.appendChild(downloadsHeading);
  const downloadsList = document.createElement("ul");
  downloadsList.classList.add("skeleton-list");
  for (let i = 0; i < 6; i++) {
    // Create 6 placeholder downloads
    const li = document.createElement("li");
    li.classList.add("skeleton", "skeleton-list-item");
    li.textContent = ""; // No text for skeleton
    downloadsList.appendChild(li);
  }
  downloadsDiv.appendChild(downloadsList);
  bookInfo.appendChild(downloadsDiv);

  // Append cover and info to the card
  bookCard.appendChild(bookCover);
  bookCard.appendChild(bookInfo);

  return bookCard;
}
