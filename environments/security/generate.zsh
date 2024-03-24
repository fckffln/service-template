cd environments/security &&
openssl genrsa -out localhost.key 2048 &&
openssl req -new -key localhost.key -out localhost.csr -config req.cnf &&
openssl x509 -req -days 365 -in localhost.csr -signkey localhost.key -out localhost.crt -extensions v3_req -extfile req.cnf
