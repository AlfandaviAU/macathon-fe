# Dwllr.ai

**Live Deployment:** [macathon.craftedbydavi.com](https://macathon.craftedbydavi.com/)

**Dwllr.ai** is an AI-powered rental ecosystem that functions as a matchmaking platform for the housing market.
* **For Tenants:** It acts as a "Tinder for housemates." Through a structured onboarding flow capturing personality traits and lifestyle needs, our AI engine forms harmonious groups.
* **For Landlords:** It provides a curated stream of pre-matched, compatible tenant groups, reducing turnover and management friction.
* **The Experience:** Tenants swipe through recommended homes; once a match is formed, the platform generates a group SMS chat to facilitate immediate coordination and application.

| <img width="600" alt="Poster." src="https://github.com/user-attachments/assets/2c8faedf-bcae-4271-ac23-cae993bdc083" /> | 
|:--:| 
| *Poster.* |

| <img width="600" alt="Discover properties." src="https://github.com/user-attachments/assets/ea659d49-694e-4e0d-8dde-075d55b0ad1f" /> | 
|:--:| 
| *Discover properties.* |

| <img width="600" alt="Interested properties." src="https://github.com/user-attachments/assets/504bb770-638a-4b0c-8d4d-18d0ca162e30" /> | 
|:--:| 
| *Interested properties.* |

| <img width="600" alt="AI match reasoning system." src="https://github.com/user-attachments/assets/92fe5145-66a9-4adb-a6a4-3ff2dbfc2f5e" /> | 
|:--:| 
| *AI match reasoning system.* |

| <img width="600" alt="Approved listings." src="https://github.com/user-attachments/assets/394de0e5-539d-489b-8ad0-ac62fd72b5f9" /> | 
|:--:| 
| *Approved listings.* |

| <img width="600" alt="New listing creation process for landlords." src="https://github.com/user-attachments/assets/ad05c098-5b78-43c0-a50f-e0824ff2fa4b" /> | 
|:--:| 
| *New listing creation process for landlords.* |

| <img width="600" alt="Landlords can approve or reject each individual applicant." src="https://github.com/user-attachments/assets/8454b52f-68a1-469d-a520-8645ff7cfe90" /> | 
|:--:| 
| *Landlords can approve or reject individual applicants.* |

## Inspiration
The rental market is fundamentally broken. Current platforms treat properties as isolated units and tenants as mere financial profiles, completely ignoring the human element of shared living. Tenants are often forced to move in with strangers without knowing if their lifestyles, cleanliness standards, or financial habits align. On the flip side, landlords face unpredictable applicant quality and mismatched groups. We wanted to shift the focus from **property-first** to **people-first**, creating a system where compatibility is the foundation of the lease.

## How we built it
The system is built as a modern, scalable web application using a modular service architecture:
* **Frontend:** Developed with **Vite** and **React** to power the tenant app, landlord portal, and admin dashboard.
* **Backend:** **Supabase** manages authentication, user profiles, property listings, and real-time updates.
* **AI Engine:** We integrated **Gemini** to drive our core recommendation logic. Compatibility is determined using high-dimensional vector embeddings to calculate a similarity score between users  based on the cosine similarity of their lifestyle vectors:

$$S(u_i, u_j) = \frac{\mathbf{v}_i \cdot \mathbf{v}_j}{\|\mathbf{v}_i\| \|\mathbf{v}_j\|}$$
* **Infrastructure:** Background workers handle matching cycles and generate high-intent interest reports for landlords.

## Challenges we ran into
The primary challenge was translating subjective human behavior into objective data. We had to iterate on our embedding models to ensure that "personality matching" wasn't just keyword matching, but a nuanced understanding of lifestyle compatibility. Additionally, balancing the marketplace supply (listings) with demand (pre-matched groups) required precise filtering logic to prevent "choice paralysis" for tenants.

## Accomplishments that we're proud of
We are proud of our **Dynamic Matching Engine**, which successfully moves beyond basic filters to evaluate group harmony. We successfully implemented a seamless transition from a digital "swipe" to a real-world communication channel (Group SMS), bridging the gap between discovery and action.
  
## Running the code locally

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.


## BACKEND REPO
https://github.com/AlfandaviAU/macathon-be
