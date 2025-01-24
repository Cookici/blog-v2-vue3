import { http } from '../http'

export const useUploadApi = {
    // 上传图片
    uploadImage(formData: FormData) {
        return http.post<{ fileUrl: string }>('/oss/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    },

    // 编辑器图片上传
    uploadEditorImage(file: File) {
        const formData = new FormData()
        formData.append('imageFile', file)
        return http.post<{ fileUrl: string }>('/oss/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
    }
}