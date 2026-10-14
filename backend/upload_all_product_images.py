from pathlib import Path
import re
import requests


# =========================================================
# CONFIGURATION
# =========================================================

BACKEND_URL = "http://127.0.0.1:8000"

IMAGE_FOLDER = Path(__file__).parent / "product_images"

SUPPORTED_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
}


# =========================================================
# NORMALIZE PRODUCT NAMES
# =========================================================

def normalize_name(name: str) -> str:
    """
    Normalize a product name or image filename.

    Examples:

        Samsung Galaxy S26
        01_Samsung_Galaxy_S26.png

    Both become:

        samsung galaxy s26
    """

    # Remove file extension
    name = Path(name).stem

    # Remove leading number from image filenames
    # Example:
    # 01_Samsung_Galaxy_S26
    # becomes:
    # Samsung_Galaxy_S26

    name = re.sub(r"^\d+[_\-\s]*", "", name)

    # Lowercase
    name = name.lower()

    # Replace special characters with spaces
    name = re.sub(r"[^a-z0-9]+", " ", name)

    # Remove extra spaces
    name = re.sub(r"\s+", " ", name)

    return name.strip()


# =========================================================
# FIND IMAGE
# =========================================================

def find_image(product_name: str, product_id: int):
    """
    Find an image matching the product.

    Special handling is included for the two products
    that have the same name: "smart watch".

    Product 3 -> 08_Smart_Watch_1.png
    Product 4 -> 09_Smart_Watch_2.png
    """

    # -----------------------------------------------------
    # SPECIAL CASE: DUPLICATE SMART WATCH PRODUCTS
    # -----------------------------------------------------

    if product_name.lower().strip() == "smart watch":

        special_images = {
            3: "08_Smart_Watch_1.png",
            4: "09_Smart_Watch_2.png",
        }

        filename = special_images.get(product_id)

        if filename:

            image_path = IMAGE_FOLDER / filename

            if image_path.exists():
                return image_path

    # -----------------------------------------------------
    # NORMAL PRODUCT MATCHING
    # -----------------------------------------------------

    target = normalize_name(product_name)

    for file in IMAGE_FOLDER.iterdir():

        if not file.is_file():
            continue

        if file.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        normalized_file_name = normalize_name(file.name)

        if normalized_file_name == target:
            return file

    return None


# =========================================================
# GET PRODUCTS
# =========================================================

def get_products():

    url = f"{BACKEND_URL}/products/"

    print()
    print("Getting products from FastAPI...")
    print()

    response = requests.get(
        url,
        timeout=30,
    )

    response.raise_for_status()

    return response.json()


# =========================================================
# UPLOAD IMAGE
# =========================================================

def upload_image(product_id: int, image_path: Path):

    url = f"{BACKEND_URL}/products/{product_id}/image"

    with image_path.open("rb") as image_file:

        files = {
            "file": (
                image_path.name,
                image_file,
                get_content_type(image_path),
            )
        }

        response = requests.post(
            url,
            files=files,
            timeout=60,
        )

    return response


# =========================================================
# CONTENT TYPE
# =========================================================

def get_content_type(path: Path):

    extension = path.suffix.lower()

    content_types = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
    }

    return content_types.get(
        extension,
        "application/octet-stream",
    )


# =========================================================
# MAIN
# =========================================================

def main():

    print("=" * 60)
    print("SHOPFLOW - BULK PRODUCT IMAGE UPLOAD")
    print("=" * 60)

    # =====================================================
    # CHECK IMAGE FOLDER
    # =====================================================

    if not IMAGE_FOLDER.exists():

        print()
        print("ERROR: Image folder does not exist:")
        print(IMAGE_FOLDER)
        print()

        print(
            "Create the folder and put your product images inside it."
        )

        return

    # =====================================================
    # COUNT LOCAL IMAGES
    # =====================================================

    local_images = [
        file
        for file in IMAGE_FOLDER.iterdir()
        if file.is_file()
        and file.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    print()
    print(
        f"Found {len(local_images)} image files in product_images."
    )

    # =====================================================
    # GET PRODUCTS
    # =====================================================

    try:

        products = get_products()

    except Exception as error:

        print()
        print("ERROR: Could not connect to FastAPI.")
        print()
        print("Make sure your backend is running:")
        print()
        print("http://127.0.0.1:8000")
        print()
        print("Details:")
        print(error)

        return

    print(
        f"Found {len(products)} products in the database."
    )

    print()

    successful = 0
    failed = 0
    missing = 0

    # =====================================================
    # PROCESS EACH PRODUCT
    # =====================================================

    for product in products:

        product_id = product["id"]
        product_name = product["name"]

        print("-" * 60)

        print(
            f"Product {product_id}: {product_name}"
        )

        # -------------------------------------------------
        # FIND MATCHING IMAGE
        # -------------------------------------------------

        image_path = find_image(
            product_name,
            product_id,
        )

        # -------------------------------------------------
        # IMAGE NOT FOUND
        # -------------------------------------------------

        if image_path is None:

            print(
                "  [MISSING] Image not found"
            )

            print(
                f"  Looking for: {normalize_name(product_name)}"
            )

            missing += 1

            continue

        print(
            f"  Image: {image_path.name}"
        )

        # -------------------------------------------------
        # UPLOAD
        # -------------------------------------------------

        try:

            response = upload_image(
                product_id,
                image_path,
            )

            if response.status_code in (200, 201):

                try:
                    data = response.json()
                except Exception:
                    data = {}

                print(
                    "  [SUCCESS] Image uploaded"
                )

                if data.get("image_url"):

                    print(
                        f"  URL: {data.get('image_url')}"
                    )

                successful += 1

            else:

                print(
                    "  [FAILED] Upload failed"
                )

                print(
                    f"  Status: {response.status_code}"
                )

                print(
                    f"  Response: {response.text}"
                )

                failed += 1

        except Exception as error:

            print(
                "  [FAILED] Upload error"
            )

            print(
                f"  Error: {error}"
            )

            failed += 1

    # =====================================================
    # SUMMARY
    # =====================================================

    print()
    print("=" * 60)
    print("UPLOAD COMPLETE")
    print("=" * 60)

    print()

    print(
        f"Products found:       {len(products)}"
    )

    print(
        f"Images uploaded:      {successful}"
    )

    print(
        f"Images missing:       {missing}"
    )

    print(
        f"Uploads failed:       {failed}"
    )

    print()

    if successful == len(products):

        print(
            "SUCCESS: All product images were uploaded!"
        )

    elif missing > 0:

        print(
            "Some products do not have matching image files."
        )

    elif failed > 0:

        print(
            "Some images could not be uploaded."
        )

    print()


# =========================================================
# RUN
# =========================================================

if __name__ == "__main__":
    main()