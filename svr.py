import numpy as np
import pandas as pd
from cvxopt import matrix, solvers

class HandmadeSVR:
    def __init__(self, C=1.0, epsilon=0.1, tol=1e-4):
        self.C = C
        self.epsilon = epsilon
        self.tol = tol
        self.w = None
        s = None
        self.b = None
        self.alphas = None
        self.support_vectors = None

    def fit(self, X, y):
        # Convert X and y to NumPy arrays if they are DataFrames/Series
        if isinstance(X, pd.DataFrame):
            X = X.values  # Convert DataFrame to NumPy array
        if isinstance(y, pd.Series):
            y = y.values  # Convert Series to NumPy array

        n_samples, n_features = X.shape

        # Tính ma trận kernel K = X * X^T (SVR tuyến tính)
        K = np.dot(X, X.T)

        # Xây dựng ma trận P đúng kích thước (2n, 2n)
        P = np.zeros((2 * n_samples, 2 * n_samples))
        for i in range(2 * n_samples):
            for j in range(2 * n_samples):
                if i < n_samples and j < n_samples:
                    P[i, j] = K[i, j]
                elif i < n_samples and j >= n_samples:
                    P[i, j] = -K[i, j - n_samples]
                elif i >= n_samples and j < n_samples:
                    P[i, j] = -K[i - n_samples, j]
                else:
                    P[i, j] = K[i - n_samples, j - n_samples]

        # Chuyển P thành ma trận cvxopt
        P = matrix(P, tc='d')

        # Vector q = -epsilon * 1 - y
        q = -self.epsilon * np.ones(2 * n_samples) - np.hstack([y, -y])
        q = matrix(q, tc='d')

        # Ràng buộc Gx <= h
        G = np.vstack([
            -np.eye(2 * n_samples),  # alpha_i, alpha_i^* >= 0
            np.eye(2 * n_samples)    # alpha_i, alpha_i^* <= C
        ])
        G = matrix(G, tc='d')

        h = np.hstack([
            np.zeros(2 * n_samples),  # alpha_i, alpha_i^* >= 0
            self.C * np.ones(2 * n_samples)  # alpha_i, alpha_i^* <= C
        ])
        h = matrix(h, tc='d')

        # Ràng buộc A^T * x = b (tổng alpha_i - alpha_i^* = 0)
        A = matrix(np.hstack([np.ones(n_samples), -np.ones(n_samples)]), (1, 2 * n_samples), tc='d')
        b = matrix(0.0, tc='d')

        # Giải bài toán QP
        solvers.options['show_progress'] = False
        solution = solvers.qp(P, q, G, h, A, b)
        alphas = np.array(solution['x']).flatten()

        # Tách alpha_i và alpha_i^*
        self.alphas = alphas[:n_samples] - alphas[n_samples:]

        # Tìm support vectors (các alpha_i trong khoảng (tol, C - tol))
        sv_idx = np.where((np.abs(self.alphas) > self.tol) & (np.abs(self.alphas) < self.C - self.tol))[0]
        self.support_vectors = X[sv_idx]
        self.support_alphas = self.alphas[sv_idx]
        self.support_y = y[sv_idx]

        # Tính w
        self.w = np.sum((self.alphas[:, np.newaxis] * X), axis=0)

        # Tính b từ một support vector
        if len(sv_idx) > 0:
            sv = sv_idx[0]
            self.b = y[sv] - np.dot(self.w, X[sv]) - self.epsilon * np.sign(self.alphas[sv])
        else:
            self.b = 0

    def predict(self, X):
        return np.dot(X, self.w) + self.b
