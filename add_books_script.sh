#!/bin/bash

# Script to add Israeli children's books to the library system
# Make sure you're logged in as an editor or admin user

# Set your API endpoint
API_URL="http://localhost:3000/api/books"

# Get your authentication token
# You need to login first and get the token
echo "Please enter your authentication token (JWT):"
read TOKEN

# Read the JSON file and add each book
cat israeli_books_data.json | jq -c '.[]' | while read book; do
  echo "Adding book: $(echo $book | jq -r '.title')"

  curl -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$book"

  echo ""
  echo "---"
  sleep 1  # Small delay between requests
done

echo "All books have been added!"
