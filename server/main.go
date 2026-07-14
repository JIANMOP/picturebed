package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
)

func main() {
	mux := http.NewServeMux()

	// Gitee 图床上传代理
	mux.HandleFunc("/api/upload/gitee", handleGiteeUpload)
	mux.HandleFunc("/api/delete/gitee", handleGiteeDelete)

	// 图片代理（绕过防盗链）
	mux.HandleFunc("/api/image/", handleImageProxy)

	// 通用 HTTP 代理
	mux.HandleFunc("/api/proxy/", handleProxy)

	log.Println("Picturebed proxy server listening on :8080")
	err := http.ListenAndServe(":8080", mux)
	if err != nil {
		log.Fatal(err)
	}
}

// ---------- Gitee Upload Proxy ----------

type GiteeUploadRequest struct {
	Content     string `json:"content"`
	Filename    string `json:"filename"`
	Username    string `json:"username"`
	Repo        string `json:"repo"`
	Branch      string `json:"branch"`
	AccessToken string `json:"accessToken"`
}

func handleGiteeUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GiteeUploadRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Content == "" || req.Filename == "" || req.Username == "" || req.Repo == "" || req.AccessToken == "" {
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	if req.Branch == "" {
		req.Branch = "master"
	}

	apiURL := fmt.Sprintf("https://gitee.com/api/v5/repos/%s/%s/contents/%s",
		url.PathEscape(req.Username),
		url.PathEscape(req.Repo),
		req.Filename,
	)

	body := map[string]string{
		"content":      req.Content,
		"branch":       req.Branch,
		"access_token": req.AccessToken,
		"message":      "Upload by Picturebed",
	}
	bodyJSON, _ := json.Marshal(body)

	resp, err := http.Post(apiURL, "application/json", bytes.NewReader(bodyJSON))
	if err != nil {
		http.Error(w, "gitee api request failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

// ---------- Gitee Delete Proxy ----------

type GiteeDeleteRequest struct {
	Owner       string `json:"owner"`
	Repo        string `json:"repo"`
	Path        string `json:"path"`
	Sha         string `json:"sha"`
	Branch      string `json:"branch"`
	AccessToken string `json:"accessToken"`
}

func handleGiteeDelete(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req GiteeDeleteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	if req.Owner == "" || req.Repo == "" || req.Path == "" || req.Sha == "" || req.AccessToken == "" {
		http.Error(w, "missing required fields", http.StatusBadRequest)
		return
	}

	if req.Branch == "" {
		req.Branch = "master"
	}

	apiURL := fmt.Sprintf("https://gitee.com/api/v5/repos/%s/%s/contents/%s",
		url.PathEscape(req.Owner),
		url.PathEscape(req.Repo),
		req.Path,
	)

	body := map[string]string{
		"sha":          req.Sha,
		"branch":       req.Branch,
		"access_token": req.AccessToken,
		"message":      "Delete by Picturebed",
	}
	bodyJSON, _ := json.Marshal(body)

	httpReq, _ := http.NewRequest("DELETE", apiURL, bytes.NewReader(bodyJSON))
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, "gitee api request failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(respBody)
}

// ---------- Image Proxy ----------

func handleImageProxy(w http.ResponseWriter, r *http.Request) {
	imageURL := r.URL.Query().Get("url")
	if imageURL == "" {
		http.Error(w, "missing url parameter", http.StatusBadRequest)
		return
	}

	resp, err := http.Get(imageURL)
	if err != nil {
		http.Error(w, "failed to fetch image: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Cache-Control", "public, max-age=86400")
	w.Header().Set("Content-Type", resp.Header.Get("Content-Type"))
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// ---------- Generic HTTP Proxy ----------

func handleProxy(w http.ResponseWriter, r *http.Request) {
	targetStr := r.URL.Query().Get("url")
	if targetStr == "" {
		http.Error(w, "missing url parameter", http.StatusBadRequest)
		return
	}

	targetURL, err := url.Parse(targetStr)
	if err != nil {
		http.Error(w, "invalid url: "+err.Error(), http.StatusBadRequest)
		return
	}

	proxyReq, err := http.NewRequest(r.Method, targetURL.String(), r.Body)
	if err != nil {
		http.Error(w, "failed to create request: "+err.Error(), http.StatusInternalServerError)
		return
	}

	for _, key := range []string{"Authorization", "Content-Type", "Depth", "Destination", "Overwrite"} {
		if v := r.Header.Get(key); v != "" {
			proxyReq.Header.Set(key, v)
		}
	}

	client := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) > 0 {
				for k, v := range via[0].Header {
					req.Header[k] = v
				}
			}
			if len(via) >= 5 {
				return http.ErrUseLastResponse
			}
			return nil
		},
	}
	resp, err := client.Do(proxyReq)
	if err != nil {
		http.Error(w, "proxy request failed: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	for key, values := range resp.Header {
		for _, v := range values {
			w.Header().Add(key, v)
		}
	}
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}
