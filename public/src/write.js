document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('chooseFile').addEventListener('change', function (event) {
        const selectedFile = event.target.files[0];

        if (selectedFile) {
            const reader = new FileReader();

            reader.addEventListener('load', function () {
                const image = document.getElementById('itemImg');
                image.src = reader.result;
            });

            reader.readAsDataURL(selectedFile);
        }
    });
});

function getByID(idname) {
    return document.getElementById(idname)
}

const title = getByID('title')
const content = getByID('content')
const select = getByID('select')
const chooseFile = getByID('chooseFile')
const price = getByID('price')

function toData() {
    return {
        title: title.value,
        content: content.value,
        category: select.value !== "과목 선택" ? select.value : null,
        price: price.value
    }
}