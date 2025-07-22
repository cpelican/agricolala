

# TODO treatments


## Context
If a user has started a treatments flow we want to be able to remind them when the next date of application starts.

Also we want this new todo treatment prefilled, with the correct doses, so the user has almost no input to add

Ideally we need to be able to do so for each product on each of their parcels



## Proposition

We should create a todo treatment when the current date has exceeded the daysBetweenApplications after date of last treatment for this product.

The creation of these todo treatments occurs in a cron job which runs each day.

Since this all of this runs for all parcels of all authorized users, we need to run this by batch so the server can handle it.

We'll argue a user will usually create one treatment for all the products they use, since usually products are applied together on one parcel.

This means we'll look only at the last valid treatment.

Note: a single treatment can contain several products with different `daysBetweenApplications`.

Therefore, we'll arbitrarily consider a todo treatment no longer valid when at least one of the products has reached it `daysBetweenApplications`.

Once we have all invalid todo treatments deleted, we can create the new todo treatment with:
- the parcel
- the product applications:
    - product
    - dose (which on a todo treatment is the advised one)


The user will then be able to update the dose of each product, add or remove products from its treatment eventually and confirm the treatment.

In the database, this will be equivalent to an update where we change the product applications and the status.


## Criticity

Sooner or later, the user will no longer need to apply treatments.
This means we would need a way for the todo treatment automatic creation to stop automatically.

If we handled this automatically, we could use the disease table: we could add sensibility sensitivityMonthMin and a sensitivityMonthMax, and if we were not between these range we would stop the todo creation.

We'll then create the treatment only if the product cures a current disease, and remove, while updating the treatment any product that does not cure a current disease.
