import os
import platform

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.dumbo.settings")

app = Celery("dumbo")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


# On Windows, the default 'prefork' pool is not supported and can raise
# `PermissionError: [WinError 5] Access is denied` due to missing semaphore
# privileges.  Fallback to a safe pool implementation when running under
# Windows so developers can run the worker locally without additional
# configuration.
if platform.system() == "Windows":
    # 'solo' executes tasks in the main thread (single-threaded) which avoids
    # the need for multiprocessing primitives unavailable on Windows without
    # elevated privileges.  For I/O-bound tasks, you may alternatively use
    # the 'threads' pool by changing this to `worker_pool="threads"`.
    app.conf.update(
        worker_pool="solo",
        worker_concurrency=1,
    )
